-- Sprint 18: Homologação — fila assíncrona, DLQ, métricas e idempotência.

create table if not exists public.integration_jobs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  integration_id uuid references public.integrations (id) on delete set null,
  provider text not null,
  operation text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'done', 'failed', 'dlq')),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_jobs_queue_idx
  on public.integration_jobs (status, run_after)
  where status in ('queued', 'failed');

alter table public.integration_jobs enable row level security;

drop policy if exists "integration_jobs_all" on public.integration_jobs;
create policy "integration_jobs_all" on public.integration_jobs
  for all to authenticated
  using (
    empresa_id is null
    or (
      empresa_id in (select public.fn_empresas_acessiveis())
      and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
    )
  )
  with check (
    empresa_id is null
    or (
      empresa_id in (select public.fn_empresas_acessiveis())
      and public.fn_papel_na_empresa(empresa_id) = 'owner'
    )
  );

create table if not exists public.integration_dlq (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.integration_jobs (id) on delete set null,
  empresa_id uuid references public.empresas (id) on delete cascade,
  provider text not null,
  operation text not null,
  payload jsonb not null default '{}'::jsonb,
  error_message text not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.integration_dlq enable row level security;

drop policy if exists "integration_dlq_select" on public.integration_dlq;
create policy "integration_dlq_select" on public.integration_dlq
  for select to authenticated
  using (
    empresa_id is null
    or (
      empresa_id in (select public.fn_empresas_acessiveis())
      and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
    )
  );

create table if not exists public.integration_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  provider text not null,
  idem_key text not null,
  result jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (provider, idem_key)
);

create index if not exists integration_idempotency_expires_idx
  on public.integration_idempotency_keys (expires_at);

alter table public.integration_idempotency_keys enable row level security;

drop policy if exists "integration_idempotency_all" on public.integration_idempotency_keys;
create policy "integration_idempotency_all" on public.integration_idempotency_keys
  for all to authenticated
  using (
    empresa_id is null
    or empresa_id in (select public.fn_empresas_acessiveis())
  )
  with check (
    empresa_id is null
    or (
      empresa_id in (select public.fn_empresas_acessiveis())
      and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
    )
  );

create table if not exists public.integration_metrics (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  provider text not null,
  metric_date date not null default current_date,
  calls integer not null default 0,
  failures integer not null default 0,
  webhooks_received integer not null default 0,
  retries integer not null default 0,
  avg_latency_ms numeric(12, 2) not null default 0,
  last_sync_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (empresa_id, provider, metric_date)
);

alter table public.integration_metrics enable row level security;

drop policy if exists "integration_metrics_all" on public.integration_metrics;
create policy "integration_metrics_all" on public.integration_metrics
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

-- Flag processed_result em webhooks
alter table public.integration_webhooks
  add column if not exists event_type text,
  add column if not exists idempotency_key text;

create index if not exists integration_webhooks_idem_idx
  on public.integration_webhooks (provider, idempotency_key)
  where idempotency_key is not null;
