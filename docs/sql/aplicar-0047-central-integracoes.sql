-- Sprint 13: Central de Integrações — schema desacoplado (delivery, WhatsApp,
-- PIX, impressoras, cardápio digital). Credenciais só em ciphertext (app-layer
-- AES-256-GCM). Sem chamadas reais a provedores nesta migration.

-- ---------------------------------------------------------------------------
-- 1) integrations
-- ---------------------------------------------------------------------------
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  provider text not null,
  category text not null check (
    category in ('delivery', 'whatsapp', 'pix', 'printer', 'cardapio_digital')
  ),
  status text not null default 'offline' check (
    status in ('offline', 'pending', 'online', 'error', 'disabled')
  ),
  config jsonb not null default '{}'::jsonb,
  webhook_url text,
  last_sync_at timestamptz,
  last_test_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, provider)
);

create index integrations_empresa_idx on public.integrations (empresa_id, category);
create index integrations_status_idx on public.integrations (empresa_id, status);

alter table public.integrations enable row level security;

create policy "integrations_select_own" on public.integrations
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

create policy "integrations_insert_owner" on public.integrations
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create policy "integrations_update_owner" on public.integrations
  for update to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create policy "integrations_delete_owner" on public.integrations
  for delete to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger integrations_set_updated_at
  before update on public.integrations
  for each row execute function public.set_updated_at();

create trigger integration_credentials_set_updated_at
  before update on public.integration_credentials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) integration_credentials (ciphertext only)
-- ---------------------------------------------------------------------------
create table public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ciphertext text not null,
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (integration_id)
);

alter table public.integration_credentials enable row level security;

-- Select permitido a owner (app nunca devolve ciphertext ao client)
create policy "integration_credentials_select_owner" on public.integration_credentials
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create policy "integration_credentials_insert_owner" on public.integration_credentials
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create policy "integration_credentials_update_owner" on public.integration_credentials
  for update to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create policy "integration_credentials_delete_owner" on public.integration_credentials
  for delete to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

-- ---------------------------------------------------------------------------
-- 3) integration_logs
-- ---------------------------------------------------------------------------
create table public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations (id) on delete set null,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  level text not null check (level in ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  event_type text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index integration_logs_empresa_idx
  on public.integration_logs (empresa_id, created_at desc);

alter table public.integration_logs enable row level security;

create policy "integration_logs_select_gestao" on public.integration_logs
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

create policy "integration_logs_insert_owner" on public.integration_logs
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

-- ---------------------------------------------------------------------------
-- 4) integration_events
-- ---------------------------------------------------------------------------
create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations (id) on delete set null,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index integration_events_empresa_idx
  on public.integration_events (empresa_id, created_at desc);

alter table public.integration_events enable row level security;

create policy "integration_events_select_gestao" on public.integration_events
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

create policy "integration_events_insert_owner" on public.integration_events
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

-- ---------------------------------------------------------------------------
-- 5) integration_syncs
-- ---------------------------------------------------------------------------
create table public.integration_syncs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations (id) on delete set null,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  sync_type text not null,
  status text not null check (status in ('running', 'success', 'error', 'skipped')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_count integer not null default 0,
  error_message text,
  duration_ms integer,
  metadata jsonb not null default '{}'::jsonb
);

create index integration_syncs_empresa_idx
  on public.integration_syncs (empresa_id, started_at desc);

alter table public.integration_syncs enable row level security;

create policy "integration_syncs_select_gestao" on public.integration_syncs
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

create policy "integration_syncs_insert_owner" on public.integration_syncs
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

create policy "integration_syncs_update_owner" on public.integration_syncs
  for update to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );

-- ---------------------------------------------------------------------------
-- 6) integration_webhooks
-- ---------------------------------------------------------------------------
create table public.integration_webhooks (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations (id) on delete set null,
  empresa_id uuid references public.empresas (id) on delete cascade,
  provider text not null,
  payload jsonb not null,
  signature_valid boolean not null default false,
  processed boolean not null default false,
  error_message text,
  created_at timestamptz not null default now()
);

create index integration_webhooks_empresa_idx
  on public.integration_webhooks (empresa_id, created_at desc);

alter table public.integration_webhooks enable row level security;

create policy "integration_webhooks_select_gestao" on public.integration_webhooks
  for select to authenticated
  using (
    empresa_id is not null
    and empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- INSERT via service-role (webhook externo) — sem policy authenticated insert

-- ---------------------------------------------------------------------------
-- 7) integration_failures
-- ---------------------------------------------------------------------------
create table public.integration_failures (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integrations (id) on delete set null,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  operation text not null,
  attempt integer not null default 1,
  error_message text not null,
  response_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index integration_failures_empresa_idx
  on public.integration_failures (empresa_id, created_at desc);

alter table public.integration_failures enable row level security;

create policy "integration_failures_select_gestao" on public.integration_failures
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

create policy "integration_failures_insert_owner" on public.integration_failures
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) = 'owner'
  );
