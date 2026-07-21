-- Sprint 14: Financeiro completo (ERP Food Service).
-- Pré-requisito: 0043+ (fn_empresas_acessiveis / fn_papel_na_empresa).

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- cost_centers
-- ---------------------------------------------------------------------------
create table public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  code text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, code)
);

alter table public.cost_centers enable row level security;

create policy "cost_centers_select" on public.cost_centers
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create policy "cost_centers_write" on public.cost_centers
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger cost_centers_updated_at
  before update on public.cost_centers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- financial_categories
-- ---------------------------------------------------------------------------
create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null check (tipo in ('receita', 'despesa', 'transferencia', 'investimento', 'imposto')),
  name text not null,
  parent_id uuid references public.financial_categories (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, tipo, name)
);

alter table public.financial_categories enable row level security;

create policy "financial_categories_all" on public.financial_categories
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger financial_categories_updated_at
  before update on public.financial_categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- financial_accounts (plano de contas)
-- ---------------------------------------------------------------------------
create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  code text not null,
  name text not null,
  tipo text not null check (tipo in ('ativo', 'passivo', 'receita', 'despesa', 'patrimonio')),
  category_id uuid references public.financial_categories (id) on delete set null,
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, code)
);

alter table public.financial_accounts enable row level security;

create policy "financial_accounts_all" on public.financial_accounts
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger financial_accounts_updated_at
  before update on public.financial_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bank_accounts
-- ---------------------------------------------------------------------------
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  name text not null,
  bank_name text,
  agency text,
  account_number text,
  tipo text not null default 'corrente' check (tipo in ('corrente', 'poupanca', 'caixa', 'digital')),
  opening_balance numeric(14, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;

create policy "bank_accounts_all" on public.bank_accounts
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger bank_accounts_updated_at
  before update on public.bank_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- accounts_payable
-- ---------------------------------------------------------------------------
create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  category_id uuid references public.financial_categories (id) on delete set null,
  bank_account_id uuid references public.bank_accounts (id) on delete set null,
  description text not null,
  competence_date date not null,
  due_date date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  interest_amount numeric(14, 2) not null default 0,
  fine_amount numeric(14, 2) not null default 0,
  installment_number integer not null default 1,
  installment_total integer not null default 1,
  parent_id uuid references public.accounts_payable (id) on delete set null,
  status text not null default 'open' check (
    status in ('open', 'partial', 'paid', 'overdue', 'cancelled')
  ),
  paid_at timestamptz,
  attachment_url text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_payable_empresa_due_idx
  on public.accounts_payable (empresa_id, due_date, status);

alter table public.accounts_payable enable row level security;

create policy "accounts_payable_all" on public.accounts_payable
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger accounts_payable_updated_at
  before update on public.accounts_payable
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- accounts_receivable
-- ---------------------------------------------------------------------------
create table public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  pedido_id uuid references public.pedidos (id) on delete set null,
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  category_id uuid references public.financial_categories (id) on delete set null,
  bank_account_id uuid references public.bank_accounts (id) on delete set null,
  source text not null default 'outro' check (
    source in ('delivery', 'mesa', 'pix', 'cartao', 'dinheiro', 'marketplace', 'outro')
  ),
  description text not null,
  competence_date date not null,
  due_date date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  received_amount numeric(14, 2) not null default 0 check (received_amount >= 0),
  interest_amount numeric(14, 2) not null default 0,
  fine_amount numeric(14, 2) not null default 0,
  installment_number integer not null default 1,
  installment_total integer not null default 1,
  parent_id uuid references public.accounts_receivable (id) on delete set null,
  status text not null default 'open' check (
    status in ('open', 'partial', 'paid', 'overdue', 'cancelled')
  ),
  auto_settle boolean not null default false,
  received_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_receivable_empresa_due_idx
  on public.accounts_receivable (empresa_id, due_date, status);

alter table public.accounts_receivable enable row level security;

create policy "accounts_receivable_all" on public.accounts_receivable
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger accounts_receivable_updated_at
  before update on public.accounts_receivable
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cash_flow
-- ---------------------------------------------------------------------------
create table public.cash_flow (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  flow_date date not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  amount numeric(14, 2) not null check (amount >= 0),
  category_id uuid references public.financial_categories (id) on delete set null,
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  bank_account_id uuid references public.bank_accounts (id) on delete set null,
  reference_type text,
  reference_id uuid,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index cash_flow_empresa_date_idx
  on public.cash_flow (empresa_id, flow_date desc);

alter table public.cash_flow enable row level security;

create policy "cash_flow_all" on public.cash_flow
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

-- ---------------------------------------------------------------------------
-- bank_transactions (conciliação)
-- ---------------------------------------------------------------------------
create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts (id) on delete cascade,
  tx_date date not null,
  tipo text not null check (tipo in ('credito', 'debito')),
  amount numeric(14, 2) not null check (amount >= 0),
  description text not null,
  source text not null default 'manual' check (
    source in ('pix', 'cartao', 'dinheiro', 'delivery', 'marketplace', 'manual', 'transferencia')
  ),
  reconciled boolean not null default false,
  reconciled_at timestamptz,
  reference_type text,
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index bank_transactions_empresa_idx
  on public.bank_transactions (empresa_id, tx_date desc);

alter table public.bank_transactions enable row level security;

create policy "bank_transactions_all" on public.bank_transactions
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

-- ---------------------------------------------------------------------------
-- financial_reports
-- ---------------------------------------------------------------------------
create table public.financial_reports (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  report_type text not null,
  period_start date not null,
  period_end date not null,
  payload jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.financial_reports enable row level security;

create policy "financial_reports_all" on public.financial_reports
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

-- ---------------------------------------------------------------------------
-- financial_forecasts
-- ---------------------------------------------------------------------------
create table public.financial_forecasts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  projected_in numeric(14, 2) not null default 0,
  projected_out numeric(14, 2) not null default 0,
  projected_balance numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.financial_forecasts enable row level security;

create policy "financial_forecasts_all" on public.financial_forecasts
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

create trigger financial_forecasts_updated_at
  before update on public.financial_forecasts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed defaults por empresa (RPC)
-- ---------------------------------------------------------------------------
create or replace function public.fn_seed_financeiro_defaults(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.fn_usuario_acessa_empresa(p_empresa_id) then
    raise exception 'Empresa não acessível';
  end if;

  insert into public.cost_centers (empresa_id, code, name)
  values
    (p_empresa_id, 'PROD', 'Produção'),
    (p_empresa_id, 'COZ', 'Cozinha'),
    (p_empresa_id, 'BAR', 'Bar'),
    (p_empresa_id, 'ADM', 'Administrativo'),
    (p_empresa_id, 'MKT', 'Marketing'),
    (p_empresa_id, 'FIN', 'Financeiro'),
    (p_empresa_id, 'RH', 'RH')
  on conflict (empresa_id, code) do nothing;

  insert into public.financial_categories (empresa_id, tipo, name)
  values
    (p_empresa_id, 'receita', 'Vendas'),
    (p_empresa_id, 'receita', 'Delivery'),
    (p_empresa_id, 'receita', 'Outras receitas'),
    (p_empresa_id, 'despesa', 'CMV'),
    (p_empresa_id, 'despesa', 'Folha'),
    (p_empresa_id, 'despesa', 'Aluguel'),
    (p_empresa_id, 'despesa', 'Marketing'),
    (p_empresa_id, 'despesa', 'Operacionais'),
    (p_empresa_id, 'despesa', 'Utilities'),
    (p_empresa_id, 'imposto', 'Impostos sobre vendas'),
    (p_empresa_id, 'transferencia', 'Transferências'),
    (p_empresa_id, 'investimento', 'Investimentos')
  on conflict (empresa_id, tipo, name) do nothing;

  insert into public.bank_accounts (empresa_id, name, tipo, opening_balance)
  select p_empresa_id, 'Caixa loja', 'caixa', 0
  where not exists (
    select 1 from public.bank_accounts
    where empresa_id = p_empresa_id and name = 'Caixa loja'
  );
end;
$$;

revoke all on function public.fn_seed_financeiro_defaults(uuid) from public, anon;
grant execute on function public.fn_seed_financeiro_defaults(uuid) to authenticated;
