-- Sprint 17: CRM, Fidelização e Marketing.
-- Pré-requisito: 0026 (clientes), 0043+ (RBAC), 0047 (integrações).

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- customers_profiles (perfil CRM 1:1 com clientes)
-- ---------------------------------------------------------------------------
create table if not exists public.customers_profiles (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  birth_date date,
  origin_channel text,
  favorite_products jsonb not null default '[]'::jsonb,
  dietary_preferences text[] not null default '{}',
  dietary_restrictions text[] not null default '{}',
  consent_whatsapp boolean not null default false,
  consent_email boolean not null default false,
  consent_sms boolean not null default false,
  consent_push boolean not null default false,
  consent_updated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, cliente_id)
);

create index if not exists customers_profiles_empresa_idx
  on public.customers_profiles (empresa_id);

alter table public.customers_profiles enable row level security;

drop policy if exists "customers_profiles_all" on public.customers_profiles;
create policy "customers_profiles_all" on public.customers_profiles
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'caixa', 'garcom'
    )
  );

drop trigger if exists customers_profiles_updated_at on public.customers_profiles;
create trigger customers_profiles_updated_at
  before update on public.customers_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- customer_preferences
-- ---------------------------------------------------------------------------
create table if not exists public.customer_preferences (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  key text not null,
  value text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, cliente_id, key)
);

alter table public.customer_preferences enable row level security;

drop policy if exists "customer_preferences_all" on public.customer_preferences;
create policy "customer_preferences_all" on public.customer_preferences
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'caixa', 'garcom'
    )
  );

-- ---------------------------------------------------------------------------
-- loyalty_programs
-- ---------------------------------------------------------------------------
create table if not exists public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  name text not null default 'Programa padrão',
  active boolean not null default true,
  points_per_currency numeric(14, 4) not null default 1
    check (points_per_currency >= 0),
  currency_per_point numeric(14, 4) not null default 0.05
    check (currency_per_point >= 0),
  cashback_percent numeric(8, 4) not null default 0
    check (cashback_percent >= 0 and cashback_percent <= 100),
  points_validity_days integer not null default 365
    check (points_validity_days between 1 and 3650),
  min_redeem_points numeric(14, 4) not null default 100
    check (min_redeem_points >= 0),
  welcome_points numeric(14, 4) not null default 0
    check (welcome_points >= 0),
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id)
);

alter table public.loyalty_programs enable row level security;

drop policy if exists "loyalty_programs_select" on public.loyalty_programs;
create policy "loyalty_programs_select" on public.loyalty_programs
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  );

drop policy if exists "loyalty_programs_write" on public.loyalty_programs;
create policy "loyalty_programs_write" on public.loyalty_programs
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists loyalty_programs_updated_at on public.loyalty_programs;
create trigger loyalty_programs_updated_at
  before update on public.loyalty_programs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- loyalty_points
-- ---------------------------------------------------------------------------
create table if not exists public.loyalty_points (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  program_id uuid not null references public.loyalty_programs (id) on delete cascade,
  tipo text not null check (tipo in ('acumulo', 'resgate', 'ajuste', 'expiracao', 'boas_vindas')),
  points numeric(14, 4) not null,
  balance_after numeric(14, 4) not null default 0,
  reference_tipo text,
  reference_id uuid,
  expires_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_points_cliente_idx
  on public.loyalty_points (empresa_id, cliente_id, created_at desc);

alter table public.loyalty_points enable row level security;

drop policy if exists "loyalty_points_all" on public.loyalty_points;
create policy "loyalty_points_all" on public.loyalty_points
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'caixa', 'garcom'
    )
  );

-- ---------------------------------------------------------------------------
-- cashback_transactions
-- ---------------------------------------------------------------------------
create table if not exists public.cashback_transactions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo text not null check (tipo in ('credito', 'debito', 'ajuste', 'expiracao')),
  amount numeric(14, 4) not null check (amount >= 0),
  balance_after numeric(14, 4) not null default 0,
  reference_tipo text,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists cashback_transactions_cliente_idx
  on public.cashback_transactions (empresa_id, cliente_id, created_at desc);

alter table public.cashback_transactions enable row level security;

drop policy if exists "cashback_transactions_all" on public.cashback_transactions;
create policy "cashback_transactions_all" on public.cashback_transactions
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'caixa', 'garcom'
    )
  );

-- ---------------------------------------------------------------------------
-- coupons + coupon_redemptions
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  tipo text not null check (tipo in (
    'percentual', 'valor_fixo', 'frete_gratis', 'brinde', 'combo',
    'primeira_compra', 'aniversario', 'inatividade'
  )),
  discount_percent numeric(8, 4) check (discount_percent is null or (discount_percent > 0 and discount_percent <= 100)),
  discount_amount numeric(14, 4) check (discount_amount is null or discount_amount >= 0),
  gift_description text,
  min_order_amount numeric(14, 4) not null default 0,
  max_uses integer,
  max_uses_per_customer integer not null default 1,
  uses_count integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  segment_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, code)
);

create index if not exists coupons_empresa_active_idx
  on public.coupons (empresa_id, active, ends_at);

alter table public.coupons enable row level security;

drop policy if exists "coupons_all" on public.coupons;
create policy "coupons_all" on public.coupons
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'caixa')
  );

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  pedido_id uuid references public.pedidos (id) on delete set null,
  discount_applied numeric(14, 4) not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions (coupon_id, created_at desc);

alter table public.coupon_redemptions enable row level security;

drop policy if exists "coupon_redemptions_all" on public.coupon_redemptions;
create policy "coupon_redemptions_all" on public.coupon_redemptions
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'financeiro', 'caixa', 'garcom'
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'caixa', 'garcom'
    )
  );

-- ---------------------------------------------------------------------------
-- customer_segments
-- ---------------------------------------------------------------------------
create table if not exists public.customer_segments (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  dynamic boolean not null default true,
  rules jsonb not null default '{}'::jsonb,
  member_count integer not null default 0,
  last_evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, key)
);

alter table public.customer_segments enable row level security;

drop policy if exists "customer_segments_all" on public.customer_segments;
create policy "customer_segments_all" on public.customer_segments
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists customer_segments_updated_at on public.customer_segments;
create trigger customer_segments_updated_at
  before update on public.customer_segments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- marketing_campaigns + campaign_recipients
-- ---------------------------------------------------------------------------
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('whatsapp', 'email', 'sms', 'push')),
  status text not null default 'rascunho'
    check (status in ('rascunho', 'agendada', 'enviando', 'enviada', 'cancelada', 'falha')),
  segment_key text,
  template_body text not null default '',
  template_name text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  automation_type text
    check (automation_type is null or automation_type in (
      'boas_vindas', 'pos_compra', 'inativos', 'aniversario', 'pontos_expirando', 'manual'
    )),
  metrics jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_campaigns_empresa_idx
  on public.marketing_campaigns (empresa_id, created_at desc);

alter table public.marketing_campaigns enable row level security;

drop policy if exists "marketing_campaigns_all" on public.marketing_campaigns;
create policy "marketing_campaigns_all" on public.marketing_campaigns
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists marketing_campaigns_updated_at on public.marketing_campaigns;
create trigger marketing_campaigns_updated_at
  before update on public.marketing_campaigns
  for each row execute function public.set_updated_at();

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  campaign_id uuid not null references public.marketing_campaigns (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'enviado', 'falha', 'ignorado')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, cliente_id)
);

create index if not exists campaign_recipients_campaign_idx
  on public.campaign_recipients (campaign_id, status);

alter table public.campaign_recipients enable row level security;

drop policy if exists "campaign_recipients_all" on public.campaign_recipients;
create policy "campaign_recipients_all" on public.campaign_recipients
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- ---------------------------------------------------------------------------
-- communication_logs
-- ---------------------------------------------------------------------------
create table if not exists public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  campaign_id uuid references public.marketing_campaigns (id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'email', 'sms', 'push')),
  provider_id text,
  status text not null check (status in ('queued', 'sent', 'failed', 'skipped')),
  to_address text,
  body text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists communication_logs_empresa_idx
  on public.communication_logs (empresa_id, created_at desc);

alter table public.communication_logs enable row level security;

drop policy if exists "communication_logs_all" on public.communication_logs;
create policy "communication_logs_all" on public.communication_logs
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- ---------------------------------------------------------------------------
-- Seed helpers
-- ---------------------------------------------------------------------------
create or replace function public.fn_seed_crm_defaults(p_empresa_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.loyalty_programs (empresa_id, name)
  values (p_empresa_id, 'Fidelidade ChefHub')
  on conflict (empresa_id) do nothing;

  insert into public.customer_segments (empresa_id, key, name, description, rules) values
    (p_empresa_id, 'vip', 'Clientes VIP', 'Alto ticket e frequência', '{"tipo":"vip"}'::jsonb),
    (p_empresa_id, 'novos', 'Novos clientes', 'Primeira compra recente ou cadastro recente', '{"tipo":"novos"}'::jsonb),
    (p_empresa_id, 'inativos', 'Clientes inativos', 'Sem compra no período', '{"tipo":"inativos","dias":45}'::jsonb),
    (p_empresa_id, 'alto_ticket', 'Alto ticket', 'Ticket médio acima do limiar', '{"tipo":"alto_ticket"}'::jsonb),
    (p_empresa_id, 'baixo_ticket', 'Baixo ticket', 'Ticket médio abaixo do limiar', '{"tipo":"baixo_ticket"}'::jsonb),
    (p_empresa_id, 'frequentes', 'Frequentes', 'Muitas compras no período', '{"tipo":"frequentes"}'::jsonb),
    (p_empresa_id, 'pouco_frequentes', 'Pouco frequentes', 'Poucas compras no período', '{"tipo":"pouco_frequentes"}'::jsonb)
  on conflict (empresa_id, key) do nothing;
end;
$$;

grant execute on function public.fn_seed_crm_defaults(uuid) to authenticated;
revoke execute on function public.fn_seed_crm_defaults(uuid) from public, anon;
