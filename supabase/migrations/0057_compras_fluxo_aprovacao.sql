-- Sprint 08: Fluxo de aprovação de solicitações de compra.
alter table public.solicitacoes_compra drop constraint solicitacoes_compra_status_check;
alter table public.solicitacoes_compra add constraint solicitacoes_compra_status_check
  check (status in ('pendente', 'aprovada', 'rejeitada', 'convertida', 'ajuste_solicitado'));

-- Faixas de aprovação configuráveis: por valor (min/max), opcionalmente
-- restritas a um centro de custo, exigindo um papel OU um usuário
-- específico (pelo menos um dos dois). Sem faixa configurada para uma
-- empresa, o fallback é "qualquer aprovador ou dono aprova" (ver funções
-- abaixo) — o fluxo funciona sem exigir configuração prévia.
create table public.compras_niveis_aprovacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  valor_minimo numeric(14, 2) not null default 0 check (valor_minimo >= 0),
  valor_maximo numeric(14, 2) check (valor_maximo is null or valor_maximo >= valor_minimo),
  centro_custo_id uuid references public.centros_custo (id) on delete set null,
  papel_aprovador text check (papel_aprovador in ('owner', 'aprovador')),
  usuario_aprovador_id uuid references public.profiles (id),
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint compras_niveis_aprovacao_exige_aprovador
    check (papel_aprovador is not null or usuario_aprovador_id is not null)
);

create index compras_niveis_aprovacao_empresa_idx on public.compras_niveis_aprovacao (empresa_id, ativo, ordem);

alter table public.compras_niveis_aprovacao enable row level security;

create policy "compras_niveis_aprovacao_select_own" on public.compras_niveis_aprovacao
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_niveis_aprovacao_insert_own" on public.compras_niveis_aprovacao
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_niveis_aprovacao_update_own" on public.compras_niveis_aprovacao
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_niveis_aprovacao_delete_own" on public.compras_niveis_aprovacao
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger compras_niveis_aprovacao_set_atualizado_em
  before update on public.compras_niveis_aprovacao
  for each row execute function public.set_atualizado_em();

-- Log append-only de toda decisão (aprovar/rejeitar/pedir ajuste) — mesmo
-- motivo de pedido_status_historico: nunca escrito diretamente, só pelas
-- funções abaixo.
create table public.solicitacoes_compra_aprovacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  solicitacao_id uuid not null references public.solicitacoes_compra (id) on delete cascade,
  nivel_id uuid references public.compras_niveis_aprovacao (id) on delete set null,
  aprovador_id uuid references public.profiles (id),
  acao text not null check (acao in ('aprovar', 'rejeitar', 'solicitar_ajuste')),
  comentario text,
  criado_em timestamptz not null default now()
);

create index solicitacoes_compra_aprovacoes_solicitacao_idx
  on public.solicitacoes_compra_aprovacoes (solicitacao_id, criado_em desc);

alter table public.solicitacoes_compra_aprovacoes enable row level security;

create policy "solicitacoes_compra_aprovacoes_select_own" on public.solicitacoes_compra_aprovacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Notificações in-app — este projeto não tem envio de e-mail/push (mesma
-- limitação já documentada para crm_interacoes, Sprint 07); é uma lista real
-- gravada no banco, exibida num sino no cabeçalho, não um disparo externo.
create table public.compras_notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id),
  tipo text not null check (tipo in ('aprovacao_pendente', 'solicitacao_aprovada', 'solicitacao_rejeitada', 'ajuste_solicitado', 'divergencia_recebimento')),
  mensagem text not null,
  referencia_tipo text check (referencia_tipo in ('solicitacao_compra', 'pedido_compra', 'recebimento')),
  referencia_id uuid,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

create index compras_notificacoes_usuario_idx on public.compras_notificacoes (usuario_id, lida, criado_em desc);

alter table public.compras_notificacoes enable row level security;

-- Cada usuário só vê e marca como lida a própria notificação — não é
-- "dono da empresa", é dono da linha (usuario_id = auth.uid()), caso
-- diferente do resto do projeto porque a notificação é pessoal, não da
-- empresa como um todo.
create policy "compras_notificacoes_select_own" on public.compras_notificacoes
  for select using (usuario_id = (select auth.uid()));
create policy "compras_notificacoes_update_own" on public.compras_notificacoes
  for update using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Notifica todo aprovador (papel 'aprovador' ativo + dono da empresa) quando
-- uma solicitação nova entra como 'pendente'.
create function public.solicitacoes_compra_notificar_aprovadores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dono_id uuid;
begin
  if new.status <> 'pendente' then
    return new;
  end if;

  select usuario_id into v_dono_id from public.empresas where id = new.empresa_id;

  insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
  select
    new.empresa_id, v_dono_id, 'aprovacao_pendente',
    'Nova solicitação de compra #' || coalesce(new.numero::text, '') || ' aguardando aprovação',
    'solicitacao_compra', new.id
  where v_dono_id is not null;

  insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
  select
    new.empresa_id, ue.usuario_id, 'aprovacao_pendente',
    'Nova solicitação de compra #' || coalesce(new.numero::text, '') || ' aguardando aprovação',
    'solicitacao_compra', new.id
  from public.usuarios_empresa ue
  where ue.empresa_id = new.empresa_id and ue.papel = 'aprovador' and ue.ativo
    and ue.usuario_id is distinct from v_dono_id;

  return new;
end;
$$;

revoke execute on function public.solicitacoes_compra_notificar_aprovadores() from public, anon, authenticated;

create trigger solicitacoes_compra_after_insert_notificar
  after insert on public.solicitacoes_compra
  for each row execute function public.solicitacoes_compra_notificar_aprovadores();

-- Encontra a faixa de aprovação aplicável (maior valor_minimo que ainda
-- cobre o valor da solicitação, restrita ao centro de custo quando a faixa
-- exige um) — usada pelas 3 funções de decisão abaixo.
create function public.fn_nivel_aprovacao_aplicavel(p_empresa_id uuid, p_valor numeric, p_centro_custo_id uuid)
returns public.compras_niveis_aprovacao
language sql
stable
set search_path = public
as $$
  select n.*
  from public.compras_niveis_aprovacao n
  where n.empresa_id = p_empresa_id
    and n.ativo
    and p_valor >= n.valor_minimo
    and (n.valor_maximo is null or p_valor <= n.valor_maximo)
    and (n.centro_custo_id is null or n.centro_custo_id = p_centro_custo_id)
  order by n.valor_minimo desc, n.ordem
  limit 1;
$$;

-- SECURITY DEFINER: precisa ler usuarios_empresa/empresas de fora da RLS do
-- chamador para validar se ELE é o aprovador exigido pela faixa aplicável —
-- mesmo motivo de fn_tem_acesso_financeiro (0043). Sem faixa configurada,
-- fallback: dono da empresa ou qualquer usuário com papel 'aprovador' pode
-- decidir.
create function public.fn_pode_aprovar_solicitacao(p_solicitacao_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_solicitacao record;
  v_valor numeric(14, 2);
  v_nivel public.compras_niveis_aprovacao;
  v_dono boolean;
  v_papel text;
begin
  select s.empresa_id, s.centro_custo_id into v_solicitacao
  from public.solicitacoes_compra s where s.id = p_solicitacao_id;

  if v_solicitacao.empresa_id is null then
    return false;
  end if;

  select exists(select 1 from public.empresas where id = v_solicitacao.empresa_id and usuario_id = auth.uid())
    into v_dono;
  if v_dono then
    return true;
  end if;

  select coalesce(sum(i.quantidade * i.preco_estimado), 0) into v_valor
  from public.solicitacoes_compra_itens i where i.solicitacao_id = p_solicitacao_id;

  select * into v_nivel
  from public.fn_nivel_aprovacao_aplicavel(v_solicitacao.empresa_id, v_valor, v_solicitacao.centro_custo_id);

  select papel into v_papel from public.usuarios_empresa
  where empresa_id = v_solicitacao.empresa_id and usuario_id = auth.uid() and ativo;

  if v_nivel.id is null then
    return v_papel = 'aprovador';
  end if;

  if v_nivel.usuario_aprovador_id is not null then
    return v_nivel.usuario_aprovador_id = auth.uid();
  end if;

  return v_papel = v_nivel.papel_aprovador;
end;
$$;

grant execute on function public.fn_pode_aprovar_solicitacao(uuid) to authenticated;
revoke execute on function public.fn_pode_aprovar_solicitacao(uuid) from public, anon;

create function public.fn_aprovar_solicitacao_compra(p_solicitacao_id uuid, p_comentario text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_status text;
  v_criado_por uuid;
begin
  select empresa_id, status, criado_por into v_empresa_id, v_status, v_criado_por
  from public.solicitacoes_compra where id = p_solicitacao_id;

  if v_empresa_id is null or v_empresa_id not in (select id from public.empresas where usuario_id = auth.uid())
    and not exists (select 1 from public.usuarios_empresa where empresa_id = v_empresa_id and usuario_id = auth.uid() and ativo) then
    raise exception 'Solicitação não encontrada ou sem permissão.';
  end if;

  if v_status not in ('pendente', 'ajuste_solicitado') then
    raise exception 'Só é possível aprovar solicitações pendentes.';
  end if;

  if not public.fn_pode_aprovar_solicitacao(p_solicitacao_id) then
    raise exception 'Você não tem papel de aprovador para esta solicitação.';
  end if;

  insert into public.solicitacoes_compra_aprovacoes (empresa_id, solicitacao_id, aprovador_id, acao, comentario)
  values (v_empresa_id, p_solicitacao_id, auth.uid(), 'aprovar', p_comentario);

  update public.solicitacoes_compra set status = 'aprovada' where id = p_solicitacao_id;

  if v_criado_por is not null then
    insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
    values (v_empresa_id, v_criado_por, 'solicitacao_aprovada', 'Sua solicitação de compra foi aprovada', 'solicitacao_compra', p_solicitacao_id);
  end if;
end;
$$;

grant execute on function public.fn_aprovar_solicitacao_compra(uuid, text) to authenticated;
revoke execute on function public.fn_aprovar_solicitacao_compra(uuid, text) from public, anon;

create function public.fn_rejeitar_solicitacao_compra(p_solicitacao_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_status text;
  v_criado_por uuid;
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Informe o motivo da rejeição.';
  end if;

  select empresa_id, status, criado_por into v_empresa_id, v_status, v_criado_por
  from public.solicitacoes_compra where id = p_solicitacao_id;

  if v_empresa_id is null then
    raise exception 'Solicitação não encontrada.';
  end if;
  if v_status not in ('pendente', 'ajuste_solicitado') then
    raise exception 'Só é possível rejeitar solicitações pendentes.';
  end if;
  if not public.fn_pode_aprovar_solicitacao(p_solicitacao_id) then
    raise exception 'Você não tem papel de aprovador para esta solicitação.';
  end if;

  insert into public.solicitacoes_compra_aprovacoes (empresa_id, solicitacao_id, aprovador_id, acao, comentario)
  values (v_empresa_id, p_solicitacao_id, auth.uid(), 'rejeitar', p_motivo);

  update public.solicitacoes_compra set status = 'rejeitada' where id = p_solicitacao_id;

  if v_criado_por is not null then
    insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
    values (v_empresa_id, v_criado_por, 'solicitacao_rejeitada', 'Sua solicitação de compra foi rejeitada: ' || p_motivo, 'solicitacao_compra', p_solicitacao_id);
  end if;
end;
$$;

grant execute on function public.fn_rejeitar_solicitacao_compra(uuid, text) to authenticated;
revoke execute on function public.fn_rejeitar_solicitacao_compra(uuid, text) from public, anon;

create function public.fn_solicitar_ajuste_solicitacao_compra(p_solicitacao_id uuid, p_comentario text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_status text;
  v_criado_por uuid;
begin
  if p_comentario is null or btrim(p_comentario) = '' then
    raise exception 'Informe o que precisa ser ajustado.';
  end if;

  select empresa_id, status, criado_por into v_empresa_id, v_status, v_criado_por
  from public.solicitacoes_compra where id = p_solicitacao_id;

  if v_empresa_id is null then
    raise exception 'Solicitação não encontrada.';
  end if;
  if v_status <> 'pendente' then
    raise exception 'Só é possível pedir ajuste em solicitações pendentes.';
  end if;
  if not public.fn_pode_aprovar_solicitacao(p_solicitacao_id) then
    raise exception 'Você não tem papel de aprovador para esta solicitação.';
  end if;

  insert into public.solicitacoes_compra_aprovacoes (empresa_id, solicitacao_id, aprovador_id, acao, comentario)
  values (v_empresa_id, p_solicitacao_id, auth.uid(), 'solicitar_ajuste', p_comentario);

  update public.solicitacoes_compra set status = 'ajuste_solicitado' where id = p_solicitacao_id;

  if v_criado_por is not null then
    insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
    values (v_empresa_id, v_criado_por, 'ajuste_solicitado', 'Ajuste solicitado na sua solicitação de compra: ' || p_comentario, 'solicitacao_compra', p_solicitacao_id);
  end if;
end;
$$;

grant execute on function public.fn_solicitar_ajuste_solicitacao_compra(uuid, text) to authenticated;
revoke execute on function public.fn_solicitar_ajuste_solicitacao_compra(uuid, text) from public, anon;
