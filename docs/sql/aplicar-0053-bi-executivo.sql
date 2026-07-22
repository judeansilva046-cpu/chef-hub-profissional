-- Sprint 19: Business Intelligence — metas executivas e isolamento por empresa.

create table if not exists public.bi_metas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null
    check (tipo in (
      'faturamento',
      'lucro',
      'cmv',
      'ticket_medio',
      'vendas',
      'desperdicio'
    )),
  periodo_inicio date not null,
  periodo_fim date not null,
  valor_meta numeric(14, 2) not null check (valor_meta >= 0),
  unidade text not null default 'BRL'
    check (unidade in ('BRL', 'percent', 'qty', 'kg')),
  observacao text,
  ativo boolean not null default true,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (periodo_fim >= periodo_inicio)
);

create index if not exists bi_metas_empresa_periodo_idx
  on public.bi_metas (empresa_id, periodo_inicio, periodo_fim)
  where ativo = true;

create index if not exists bi_metas_empresa_tipo_idx
  on public.bi_metas (empresa_id, tipo)
  where ativo = true;

alter table public.bi_metas enable row level security;

drop policy if exists "bi_metas_select" on public.bi_metas;
create policy "bi_metas_select" on public.bi_metas
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

drop policy if exists "bi_metas_insert" on public.bi_metas;
create policy "bi_metas_insert" on public.bi_metas
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

drop policy if exists "bi_metas_update" on public.bi_metas;
create policy "bi_metas_update" on public.bi_metas
  for update to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

drop policy if exists "bi_metas_delete" on public.bi_metas;
create policy "bi_metas_delete" on public.bi_metas
  for delete to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

comment on table public.bi_metas is
  'Metas executivas do BI (faturamento, lucro, CMV, ticket, vendas, desperdício).';
