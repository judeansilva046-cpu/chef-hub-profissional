-- Sprint 04: Etiquetas de Validade + arquitetura de impressão térmica
-- (Chef Hub Web -> Fila de Impressão -> Agente Local Windows -> Impressora).
-- Três tabelas: agentes_impressao (credencial do agente local por empresa),
-- fila_impressao (jobs, consumidos pelo agente via API própria — ver
-- docs/AGENTE-LOCAL.md) e etiquetas_impressas (histórico de emissão,
-- referenciando estoque_lotes em vez de duplicar numero_lote/data_validade).

create table public.agentes_impressao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  -- Nunca a chave em texto puro (mesmo princípio de senha) — só o hash
  -- SHA-256 gravado aqui; a chave real é mostrada uma única vez na criação.
  chave_api_hash text not null,
  ativo boolean not null default true,
  ultimo_ping_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index agentes_impressao_chave_hash_key on public.agentes_impressao (chave_api_hash);
create index agentes_impressao_empresa_ativo_idx on public.agentes_impressao (empresa_id, ativo);

alter table public.agentes_impressao enable row level security;

-- CRUD via sessão normal (o usuário gerencia agentes pela UI web). O agente
-- local em si NUNCA usa essas policies — ele autentica via API própria
-- (Bearer da chave), que roda com o client service-role e faz a checagem de
-- posse manualmente (mesmo padrão das funções SECURITY DEFINER do projeto).
create policy "agentes_impressao_select_own" on public.agentes_impressao
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "agentes_impressao_insert_own" on public.agentes_impressao
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "agentes_impressao_update_own" on public.agentes_impressao
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "agentes_impressao_delete_own" on public.agentes_impressao
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger agentes_impressao_set_atualizado_em
  before update on public.agentes_impressao
  for each row execute function public.set_atualizado_em();

create table public.fila_impressao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null default 'etiqueta_validade' check (tipo in ('etiqueta_validade')),
  -- Dados já resolvidos para o agente renderizar a etiqueta (produto, lote,
  -- validade, tamanho, quantidade) — o agente local não consulta o banco
  -- diretamente, só lê o payload do job.
  payload jsonb not null,
  status text not null default 'pendente' check (
    status in ('pendente', 'processando', 'concluido', 'erro')
  ),
  tentativas integer not null default 0,
  erro_mensagem text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  processado_em timestamptz
);

create index fila_impressao_empresa_status_idx on public.fila_impressao (empresa_id, status, criado_em);

alter table public.fila_impressao enable row level security;

-- Só SELECT/INSERT/DELETE pela sessão normal (visualizar status na UI web,
-- enfileirar via fn_emitir_etiqueta, cancelar um job ainda pendente). Sem
-- UPDATE aqui: a transição de status (pendente -> processando -> concluído/
-- erro) é feita SÓ pela API do agente local, que roda com service-role e
-- bypassa RLS deliberadamente (o agente não tem sessão Supabase Auth) —
-- checagem de posse manual na Route Handler, documentada em
-- docs/AGENTE-LOCAL.md.
create policy "fila_impressao_select_own" on public.fila_impressao
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "fila_impressao_insert_own" on public.fila_impressao
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "fila_impressao_delete_own" on public.fila_impressao
  for delete using (
    empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
    and status = 'pendente'
  );

create table public.etiquetas_impressas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  lote_id uuid references public.estoque_lotes (id) on delete set null,
  responsavel_id uuid references public.profiles (id),
  codigo_interno text not null,
  tamanho text not null default '50x30' check (tamanho in ('50x30', '60x40')),
  quantidade_etiquetas integer not null default 1 check (quantidade_etiquetas > 0),
  fila_impressao_id uuid references public.fila_impressao (id) on delete set null,
  emitido_em timestamptz not null default now(),
  criado_por uuid references public.profiles (id)
);

create index etiquetas_impressas_empresa_emitido_idx on public.etiquetas_impressas (empresa_id, emitido_em desc);
create unique index etiquetas_impressas_empresa_codigo_key on public.etiquetas_impressas (empresa_id, codigo_interno);

alter table public.etiquetas_impressas enable row level security;

-- Só SELECT/INSERT: histórico de emissão é auditoria, mesmo padrão de
-- fichas_tecnicas_versoes/estoque_movimentacoes — não é editado nem apagado
-- pelo cliente. Toda escrita passa por fn_emitir_etiqueta (abaixo).
create policy "etiquetas_impressas_select_own" on public.etiquetas_impressas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "etiquetas_impressas_insert_own" on public.etiquetas_impressas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Único caminho de escrita para emitir uma etiqueta: cria o job na fila de
-- impressão E o registro histórico numa única transação (mesmo motivo de
-- toda função "único caminho de escrita" do projeto — não deixar a etiqueta
-- "pela metade" se a conexão cair no meio). SECURITY INVOKER: as duas
-- tabelas já permitem INSERT direto para o usuário autenticado via RLS
-- acima, então não precisa bypassar nada (mesmo caso de
-- fn_duplicar_ficha_tecnica).
create function public.fn_emitir_etiqueta(
  p_empresa_id uuid,
  p_lote_id uuid,
  p_tamanho text,
  p_quantidade_etiquetas integer,
  p_payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_fila_id uuid;
  v_etiqueta_id uuid;
  v_codigo text;
begin
  insert into public.fila_impressao (empresa_id, tipo, payload, criado_por)
  values (p_empresa_id, 'etiqueta_validade', p_payload, auth.uid())
  returning id into v_fila_id;

  v_codigo := 'ETQ-' || to_char(now(), 'YYYYMMDD') || '-' || substr(v_fila_id::text, 1, 8);

  insert into public.etiquetas_impressas (
    empresa_id, lote_id, responsavel_id, codigo_interno, tamanho,
    quantidade_etiquetas, fila_impressao_id, criado_por
  )
  values (
    p_empresa_id, p_lote_id, auth.uid(), v_codigo, p_tamanho,
    p_quantidade_etiquetas, v_fila_id, auth.uid()
  )
  returning id into v_etiqueta_id;

  return v_etiqueta_id;
end;
$$;
