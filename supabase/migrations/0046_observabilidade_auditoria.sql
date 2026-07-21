-- Sprint 12: Observabilidade — auditoria, logs, alertas e amostras de performance.
-- Pré-requisito: 0043+ (fn_empresas_acessiveis / fn_papel_na_empresa).

-- ---------------------------------------------------------------------------
-- 1) Auditoria de ações
-- ---------------------------------------------------------------------------
create table public.auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete set null,
  usuario_id uuid references public.profiles (id) on delete set null,
  papel text,
  acao text not null,
  entidade text not null,
  registro_id text,
  valor_anterior jsonb,
  valor_novo jsonb,
  ip text,
  user_agent text,
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index auditoria_eventos_empresa_criado_idx
  on public.auditoria_eventos (empresa_id, criado_em desc);
create index auditoria_eventos_entidade_idx
  on public.auditoria_eventos (empresa_id, entidade, criado_em desc);
create index auditoria_eventos_usuario_idx
  on public.auditoria_eventos (usuario_id, criado_em desc);

alter table public.auditoria_eventos enable row level security;

-- Insert: qualquer autenticado (próprias ações); empresa null ou acessível
create policy "auditoria_eventos_insert_own" on public.auditoria_eventos
  for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    and (
      empresa_id is null
      or empresa_id in (select public.fn_empresas_acessiveis())
    )
  );

-- Select: owner/gerente da empresa; eventos sem empresa só o próprio usuário
create policy "auditoria_eventos_select_gestao" on public.auditoria_eventos
  for select to authenticated
  using (
    (
      empresa_id is not null
      and empresa_id in (select public.fn_empresas_acessiveis())
      and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
    )
    or (
      empresa_id is null
      and usuario_id = (select auth.uid())
    )
  );

-- Sem update/delete para authenticated (append-only)

-- ---------------------------------------------------------------------------
-- 2) Logs de sistema
-- ---------------------------------------------------------------------------
create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete set null,
  nivel text not null check (nivel in ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  modulo text not null,
  mensagem text not null,
  detalhes jsonb not null default '{}'::jsonb,
  usuario_id uuid references public.profiles (id) on delete set null,
  duracao_ms integer,
  criado_em timestamptz not null default now()
);

create index system_logs_empresa_nivel_idx
  on public.system_logs (empresa_id, nivel, criado_em desc);
create index system_logs_modulo_idx
  on public.system_logs (modulo, criado_em desc);

alter table public.system_logs enable row level security;

create policy "system_logs_insert_authenticated" on public.system_logs
  for insert to authenticated
  with check (
    empresa_id is null
    or empresa_id in (select public.fn_empresas_acessiveis())
  );

create policy "system_logs_select_gestao" on public.system_logs
  for select to authenticated
  using (
    empresa_id is not null
    and empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- ---------------------------------------------------------------------------
-- 3) Alertas operacionais
-- ---------------------------------------------------------------------------
create table public.system_alerts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null,
  severidade text not null check (severidade in ('info', 'warning', 'error', 'critical')),
  titulo text not null,
  mensagem text not null,
  entidade text,
  registro_id text,
  resolvido boolean not null default false,
  resolvido_em timestamptz,
  resolvido_por uuid references public.profiles (id),
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index system_alerts_empresa_aberto_idx
  on public.system_alerts (empresa_id, resolvido, criado_em desc);

alter table public.system_alerts enable row level security;

create policy "system_alerts_select_gestao" on public.system_alerts
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- Insert: qualquer membro da empresa (alertas gerados pelo sistema nas actions)
create policy "system_alerts_insert_membro" on public.system_alerts
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
  );

create policy "system_alerts_update_gestao" on public.system_alerts
  for update to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- ---------------------------------------------------------------------------
-- 4) Amostras de performance (rotas/RPC lentas)
-- ---------------------------------------------------------------------------
create table public.performance_samples (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete set null,
  tipo text not null check (tipo in ('rota', 'rpc', 'sql', 'render')),
  nome text not null,
  duracao_ms integer not null check (duracao_ms >= 0),
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index performance_samples_empresa_idx
  on public.performance_samples (empresa_id, criado_em desc);
create index performance_samples_lentas_idx
  on public.performance_samples (duracao_ms desc, criado_em desc);

alter table public.performance_samples enable row level security;

create policy "performance_samples_insert_auth" on public.performance_samples
  for insert to authenticated
  with check (
    empresa_id is null
    or empresa_id in (select public.fn_empresas_acessiveis())
  );

create policy "performance_samples_select_gestao" on public.performance_samples
  for select to authenticated
  using (
    empresa_id is not null
    and empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- ---------------------------------------------------------------------------
-- 5) RPC de inserção de auditoria (SECURITY DEFINER — bypass RLS write edge)
-- ---------------------------------------------------------------------------
create or replace function public.fn_registrar_auditoria(
  p_empresa_id uuid,
  p_acao text,
  p_entidade text,
  p_registro_id text default null,
  p_valor_anterior jsonb default null,
  p_valor_novo jsonb default null,
  p_ip text default null,
  p_user_agent text default null,
  p_metadados jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_papel text;
begin
  if (select auth.uid()) is null then
    raise exception 'Não autenticado';
  end if;

  if p_empresa_id is not null
    and not public.fn_usuario_acessa_empresa(p_empresa_id)
  then
    raise exception 'Empresa não acessível';
  end if;

  if p_empresa_id is not null then
    v_papel := public.fn_papel_na_empresa(p_empresa_id);
  end if;

  insert into public.auditoria_eventos (
    empresa_id, usuario_id, papel, acao, entidade, registro_id,
    valor_anterior, valor_novo, ip, user_agent, metadados
  ) values (
    p_empresa_id,
    (select auth.uid()),
    v_papel,
    p_acao,
    p_entidade,
    p_registro_id,
    p_valor_anterior,
    p_valor_novo,
    p_ip,
    p_user_agent,
    coalesce(p_metadados, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.fn_registrar_auditoria(
  uuid, text, text, text, jsonb, jsonb, text, text, jsonb
) from public, anon;
grant execute on function public.fn_registrar_auditoria(
  uuid, text, text, text, jsonb, jsonb, text, text, jsonb
) to authenticated;
