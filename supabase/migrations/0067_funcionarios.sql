-- Cleanup pré-Sprint 09: "Calculadora completa de custos de funcionários"
-- (único pilar do roadmap do produto ainda sem nenhuma implementação, ver
-- docs/PRODUCT-VISION.md). CRUD simples — mesmo padrão de custos_fixos
-- (0024): nenhuma escrita aqui tem efeito colateral em outra tabela, então
-- sem RPC, só RLS + trigger de atualizado_em. Cálculo de custo mensal/hora
-- é derivado em TypeScript (src/features/funcionarios/calculations.ts),
-- nunca gravado em coluna — mesmo princípio de estoque_saldos/
-- crm_clientes_metricas: nada aqui é fonte de verdade que se desatualiza.
create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  cargo text,
  tipo_contratacao text not null default 'clt' check (tipo_contratacao in ('clt', 'pj', 'horista')),
  -- CLT/PJ: valor mensal fixo. Horista: valor da hora — a UI rotula o
  -- campo de acordo com tipo_contratacao, mas é a mesma coluna (mesmo
  -- princípio de fornecedor_ingredientes.preco_unitario servir preço por
  -- qualquer unidade de compra escolhida).
  salario_base numeric(14, 2) not null default 0 check (salario_base >= 0),
  carga_horaria_semanal numeric(5, 2) not null default 44 check (carga_horaria_semanal > 0),
  -- Percentual agregado de encargos (INSS/FGTS/13º/férias/rescisão) sobre o
  -- salário — uma estimativa de custo, não uma folha de pagamento com
  -- apuração legal linha a linha (fora do escopo desta calculadora).
  encargos_percentual numeric(5, 2) not null default 0 check (encargos_percentual >= 0),
  -- Agregado de benefícios em R$/mês (vale-transporte, vale-refeição,
  -- plano de saúde etc.) — mesmo motivo de não abrir um item por benefício:
  -- é uma calculadora de custo total, não um módulo de RH.
  beneficios_valor numeric(14, 2) not null default 0 check (beneficios_valor >= 0),
  data_admissao date,
  data_desligamento date,
  ativo boolean not null default true,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index funcionarios_empresa_ativo_idx on public.funcionarios (empresa_id, ativo);

alter table public.funcionarios enable row level security;

create policy "funcionarios_select_own" on public.funcionarios
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "funcionarios_insert_own" on public.funcionarios
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "funcionarios_update_own" on public.funcionarios
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger funcionarios_set_atualizado_em
  before update on public.funcionarios
  for each row execute function public.set_atualizado_em();
