-- Sprint 06: Financeiro nível ERP. Plano de Contas e Centros de Custo são a
-- base de categorização de tudo que vem depois (contas a pagar/receber,
-- DRE) — não duplicam custos_fixos/custos_variaveis (0024, que continuam
-- sendo os TEMPLATES recorrentes mensais) nem canais_venda/clientes/
-- fornecedores (continuam sendo quem/onde, não o quê contábil).

-- empresa_id nulo = nunca usado aqui (diferente de unidades_medida/
-- pracas_producao) — plano de contas é específico da empresa desde o
-- início, cada negócio categoriza do seu jeito.
create table public.plano_contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  codigo text not null,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa', 'ativo', 'passivo')),
  conta_pai_id uuid references public.plano_contas (id) on delete set null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index plano_contas_empresa_codigo_key on public.plano_contas (empresa_id, codigo);
create index plano_contas_empresa_tipo_idx on public.plano_contas (empresa_id, tipo, ativo);
create index plano_contas_pai_idx on public.plano_contas (conta_pai_id) where conta_pai_id is not null;

alter table public.plano_contas enable row level security;

-- Sem DELETE: conta pode estar referenciada em contas_pagar/contas_receber
-- históricas — "remover" = ativo=false (mesmo motivo de fornecedores/clientes).
create policy "plano_contas_select_own" on public.plano_contas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "plano_contas_insert_own" on public.plano_contas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "plano_contas_update_own" on public.plano_contas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger plano_contas_set_atualizado_em
  before update on public.plano_contas
  for each row execute function public.set_atualizado_em();

-- Impede um ciclo trivial (conta sendo pai de si mesma) — hierarquia mais
-- profunda não é validada em SQL (custo/benefício não compensa nesta
-- sprint), a UI limita a 2 níveis.
alter table public.plano_contas
  add constraint plano_contas_pai_nao_e_ela_mesma check (conta_pai_id <> id);

create table public.centros_custo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  codigo text not null,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index centros_custo_empresa_codigo_key on public.centros_custo (empresa_id, codigo);
create index centros_custo_empresa_ativo_idx on public.centros_custo (empresa_id, ativo);

alter table public.centros_custo enable row level security;

create policy "centros_custo_select_own" on public.centros_custo
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "centros_custo_insert_own" on public.centros_custo
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "centros_custo_update_own" on public.centros_custo
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger centros_custo_set_atualizado_em
  before update on public.centros_custo
  for each row execute function public.set_atualizado_em();

-- Seed para toda empresa já existente (mesmo padrão de canais_venda, 0025).
-- Novas empresas recebem o mesmo seed em src/features/empresa/actions.ts
-- (criarEmpresa), fora desta migration.
insert into public.plano_contas (empresa_id, codigo, nome, tipo)
select empresas.id, padrao.codigo, padrao.nome, padrao.tipo
from public.empresas
cross join (
  values
    ('1', 'Receitas', 'receita'),
    ('1.1', 'Vendas de Produtos', 'receita'),
    ('1.2', 'Receitas Financeiras', 'receita'),
    ('2', 'Custos e Despesas', 'despesa'),
    ('2.1', 'CMV - Custo da Mercadoria Vendida', 'despesa'),
    ('2.2', 'Despesas com Pessoal', 'despesa'),
    ('2.3', 'Despesas Operacionais', 'despesa'),
    ('2.4', 'Despesas Financeiras', 'despesa'),
    ('2.5', 'Impostos e Taxas', 'despesa'),
    ('3', 'Ativo Circulante', 'ativo'),
    ('4', 'Passivo Circulante', 'passivo')
) as padrao (codigo, nome, tipo);

update public.plano_contas filho
set conta_pai_id = pai.id
from public.plano_contas pai
where filho.empresa_id = pai.empresa_id
  and pai.codigo = '1' and filho.codigo in ('1.1', '1.2');

update public.plano_contas filho
set conta_pai_id = pai.id
from public.plano_contas pai
where filho.empresa_id = pai.empresa_id
  and pai.codigo = '2' and filho.codigo in ('2.1', '2.2', '2.3', '2.4', '2.5');

insert into public.centros_custo (empresa_id, codigo, nome)
select empresas.id, padrao.codigo, padrao.nome
from public.empresas
cross join (
  values
    ('COZ', 'Cozinha'),
    ('SAL', 'Salão'),
    ('DEL', 'Delivery'),
    ('ADM', 'Administrativo')
) as padrao (codigo, nome);
