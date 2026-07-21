-- Calculadora de custos de funcionários. CRUD simples, sem RPC — mesmo
-- padrão de canais_venda (migration 0025). Encargos são um percentual
-- simplificado (INSS+FGTS+provisões approx.) editável por funcionário.
-- Reaproveita set_atualizado_em() (migration 0023).

create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  cargo text,
  tipo_contrato text not null default 'clt' check (
    tipo_contrato in ('clt', 'pj', 'temporario', 'estagio', 'outro')
  ),
  salario_bruto numeric(14, 2) not null check (salario_bruto >= 0),
  carga_horaria_semanal numeric(5, 2) not null default 44 check (carga_horaria_semanal > 0),
  beneficios_mensais numeric(14, 2) not null default 0 check (beneficios_mensais >= 0),
  -- Default 36.8% ≈ INSS patronal + FGTS + provisões de 13º/férias (simplificado BR)
  percentual_encargos numeric(5, 2) not null default 36.8 check (percentual_encargos >= 0),
  ativo boolean not null default true,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index funcionarios_empresa_ativo_idx on public.funcionarios (empresa_id, ativo);
create index funcionarios_empresa_nome_idx on public.funcionarios (empresa_id, nome);

alter table public.funcionarios enable row level security;

create policy "funcionarios_select_own" on public.funcionarios
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "funcionarios_insert_own" on public.funcionarios
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "funcionarios_update_own" on public.funcionarios
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "funcionarios_delete_own" on public.funcionarios
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger funcionarios_set_atualizado_em
  before update on public.funcionarios
  for each row execute function public.set_atualizado_em();
