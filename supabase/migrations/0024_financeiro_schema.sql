-- Sprint 03: módulo Financeiro. Sem RPCs — diferente de Estoque/Compras/
-- Produção, nenhuma dessas tabelas tem efeito colateral em outra tabela ao
-- ser escrita, então CRUD simples (mesmo padrão de fornecedores/categorias)
-- é suficiente. Trigger de atualizado_em reaproveita set_atualizado_em()
-- (criada na migration 0023) em vez de set_updated_at() (que escreve em
-- updated_at, coluna que estas tabelas não têm).

create table public.custos_fixos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  categoria text not null default 'outros' check (
    categoria in ('aluguel', 'salarios', 'utilidades', 'seguros', 'software', 'outros')
  ),
  valor_mensal numeric(14, 2) not null check (valor_mensal >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index custos_fixos_empresa_ativo_idx on public.custos_fixos (empresa_id, ativo);

alter table public.custos_fixos enable row level security;

create policy "custos_fixos_select_own" on public.custos_fixos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "custos_fixos_insert_own" on public.custos_fixos
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "custos_fixos_update_own" on public.custos_fixos
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger custos_fixos_set_atualizado_em
  before update on public.custos_fixos
  for each row execute function public.set_atualizado_em();

-- tipo='percentual_sobre_venda': percentual do preço de venda (taxa de
-- cartão, comissão de marketplace, imposto). tipo='valor_fixo_por_venda':
-- valor em R$ aplicado por venda, independente do preço (embalagem, taxa de
-- entrega fixa).
create table public.custos_variaveis (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('percentual_sobre_venda', 'valor_fixo_por_venda')),
  valor numeric(14, 4) not null check (valor >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index custos_variaveis_empresa_ativo_idx on public.custos_variaveis (empresa_id, ativo);

alter table public.custos_variaveis enable row level security;

create policy "custos_variaveis_select_own" on public.custos_variaveis
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "custos_variaveis_insert_own" on public.custos_variaveis
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "custos_variaveis_update_own" on public.custos_variaveis
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger custos_variaveis_set_atualizado_em
  before update on public.custos_variaveis
  for each row execute function public.set_atualizado_em();

-- Uma meta por mês (mes_referencia sempre dia 1, convenção de aplicação).
create table public.metas_vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  mes_referencia date not null,
  valor_meta_receita numeric(14, 2) not null check (valor_meta_receita >= 0),
  quantidade_meta numeric(14, 2) check (quantidade_meta >= 0),
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, mes_referencia)
);

create index metas_vendas_empresa_mes_idx on public.metas_vendas (empresa_id, mes_referencia desc);

alter table public.metas_vendas enable row level security;

create policy "metas_vendas_select_own" on public.metas_vendas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "metas_vendas_insert_own" on public.metas_vendas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "metas_vendas_update_own" on public.metas_vendas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "metas_vendas_delete_own" on public.metas_vendas
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger metas_vendas_set_atualizado_em
  before update on public.metas_vendas
  for each row execute function public.set_atualizado_em();
