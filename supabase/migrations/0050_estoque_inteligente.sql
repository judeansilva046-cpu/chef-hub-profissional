-- Sprint 16: Estoque Inteligente + IA de Compras.
-- Pré-requisito: 0013–0022 (estoque), 0043+ (RBAC helpers).

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enrich existing lots (fabricação + rastreabilidade)
-- ---------------------------------------------------------------------------
alter table public.estoque_lotes
  add column if not exists data_fabricacao date,
  add column if not exists codigo_rastreabilidade text;

alter table public.estoque_inventarios
  add column if not exists tipo text,
  add column if not exists setor text;

update public.estoque_inventarios set tipo = 'geral' where tipo is null;

alter table public.estoque_inventarios
  alter column tipo set default 'geral';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'estoque_inventarios_tipo_check'
  ) then
    alter table public.estoque_inventarios
      add constraint estoque_inventarios_tipo_check
      check (tipo in ('parcial', 'geral', 'setor'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- inventory_batches (camada inteligente sobre lotes)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  estoque_lote_id uuid references public.estoque_lotes (id) on delete set null,
  batch_code text,
  manufactured_at date,
  expires_at date,
  quantity_initial numeric(14, 4) not null default 0 check (quantity_initial >= 0),
  quantity_current numeric(14, 4) not null default 0 check (quantity_current >= 0),
  unit_cost numeric(14, 4) not null default 0 check (unit_cost >= 0),
  traceability_code text,
  status text not null default 'ativo'
    check (status in ('ativo', 'esgotado', 'vencido', 'bloqueado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_batches_empresa_ing_idx
  on public.inventory_batches (empresa_id, ingrediente_id);

create index if not exists inventory_batches_expires_idx
  on public.inventory_batches (empresa_id, expires_at)
  where expires_at is not null and status = 'ativo';

alter table public.inventory_batches enable row level security;

drop policy if exists "inventory_batches_all" on public.inventory_batches;
create policy "inventory_batches_all" on public.inventory_batches
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists inventory_batches_updated_at on public.inventory_batches;
create trigger inventory_batches_updated_at
  before update on public.inventory_batches
  for each row execute function public.set_updated_at();

create unique index if not exists inventory_batches_estoque_lote_uidx
  on public.inventory_batches (estoque_lote_id)
  where estoque_lote_id is not null;

-- ---------------------------------------------------------------------------
-- inventory_counts (+ items) — inventário parcial / geral / por setor
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  name text not null,
  tipo text not null default 'geral'
    check (tipo in ('parcial', 'geral', 'setor')),
  setor text,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluido', 'cancelado')),
  estoque_inventario_id uuid references public.estoque_inventarios (id) on delete set null,
  notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_counts_empresa_idx
  on public.inventory_counts (empresa_id, started_at desc);

alter table public.inventory_counts enable row level security;

drop policy if exists "inventory_counts_all" on public.inventory_counts;
create policy "inventory_counts_all" on public.inventory_counts
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists inventory_counts_updated_at on public.inventory_counts;
create trigger inventory_counts_updated_at
  before update on public.inventory_counts
  for each row execute function public.set_updated_at();

create table if not exists public.inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.inventory_counts (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  system_qty numeric(14, 4) not null default 0,
  counted_qty numeric(14, 4),
  variance_qty numeric(14, 4) generated always as (coalesce(counted_qty, 0) - system_qty) stored,
  unit_cost numeric(14, 4) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique (count_id, ingrediente_id)
);

create index if not exists inventory_count_items_count_idx
  on public.inventory_count_items (count_id);

alter table public.inventory_count_items enable row level security;

drop policy if exists "inventory_count_items_all" on public.inventory_count_items;
create policy "inventory_count_items_all" on public.inventory_count_items
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
-- inventory_losses — quebra / vencimento / desperdício / produção
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_losses (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  batch_id uuid references public.inventory_batches (id) on delete set null,
  estoque_lote_id uuid references public.estoque_lotes (id) on delete set null,
  reason text not null
    check (reason in ('quebra', 'vencimento', 'desperdicio', 'producao', 'outro')),
  quantity numeric(14, 4) not null check (quantity > 0),
  unit_cost numeric(14, 4) not null default 0 check (unit_cost >= 0),
  total_cost numeric(14, 4) generated always as (quantity * unit_cost) stored,
  lost_at date not null default current_date,
  notes text,
  movimentacao_id uuid references public.estoque_movimentacoes (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_losses_empresa_idx
  on public.inventory_losses (empresa_id, lost_at desc);

create index if not exists inventory_losses_ingrediente_idx
  on public.inventory_losses (empresa_id, ingrediente_id);

alter table public.inventory_losses enable row level security;

drop policy if exists "inventory_losses_all" on public.inventory_losses;
create policy "inventory_losses_all" on public.inventory_losses
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
-- purchase_suggestions
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_suggestions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  suggested_qty numeric(14, 4) not null check (suggested_qty >= 0),
  unit_price numeric(14, 4),
  estimated_total numeric(14, 4),
  buy_by date,
  priority text not null default 'media'
    check (priority in ('baixa', 'media', 'alta', 'critica')),
  reason text not null default '',
  status text not null default 'aberta'
    check (status in ('aberta', 'aceita', 'rejeitada', 'comprada', 'expirada')),
  stock_on_hand numeric(14, 4) not null default 0,
  avg_daily_consumption numeric(14, 4) not null default 0,
  days_of_cover numeric(14, 4),
  source text not null default 'auto'
    check (source in ('auto', 'manual', 'ia')),
  lista_compra_id uuid references public.listas_compra (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchase_suggestions_empresa_status_idx
  on public.purchase_suggestions (empresa_id, status, priority);

alter table public.purchase_suggestions enable row level security;

drop policy if exists "purchase_suggestions_all" on public.purchase_suggestions;
create policy "purchase_suggestions_all" on public.purchase_suggestions
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists purchase_suggestions_updated_at on public.purchase_suggestions;
create trigger purchase_suggestions_updated_at
  before update on public.purchase_suggestions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- inventory_forecasts
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_forecasts (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  horizon_days integer not null default 7 check (horizon_days between 1 and 90),
  forecast_qty numeric(14, 4) not null default 0,
  avg_daily_qty numeric(14, 4) not null default 0,
  seasonality_factor numeric(8, 4) not null default 1,
  method text not null default 'media_movel'
    check (method in ('media_movel', 'sazonal', 'demanda_planejada', 'hibrido')),
  period_start date not null,
  period_end date not null,
  confidence numeric(5, 2) not null default 50
    check (confidence between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (empresa_id, ingrediente_id, period_start, period_end, method)
);

create index if not exists inventory_forecasts_empresa_idx
  on public.inventory_forecasts (empresa_id, period_end desc);

alter table public.inventory_forecasts enable row level security;

drop policy if exists "inventory_forecasts_all" on public.inventory_forecasts;
create policy "inventory_forecasts_all" on public.inventory_forecasts
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
-- inventory_analytics — snapshots (ABC, giro, CMV, alertas)
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_analytics (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  metric_date date not null default current_date,
  metric_type text not null
    check (metric_type in (
      'abc', 'giro', 'cobertura', 'consumo', 'perdas',
      'cmv', 'alertas', 'economia', 'dashboard'
    )),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (empresa_id, metric_date, metric_type)
);

create index if not exists inventory_analytics_empresa_idx
  on public.inventory_analytics (empresa_id, metric_date desc);

alter table public.inventory_analytics enable row level security;

drop policy if exists "inventory_analytics_all" on public.inventory_analytics;
create policy "inventory_analytics_all" on public.inventory_analytics
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
-- Sync batch row when estoque_lotes is created/updated
-- ---------------------------------------------------------------------------
create or replace function public.estoque_lotes_sync_inventory_batch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  v_status := case
    when new.quantidade_atual <= 0 then 'esgotado'
    when new.data_validade is not null and new.data_validade < current_date then 'vencido'
    else 'ativo'
  end;

  insert into public.inventory_batches (
    empresa_id, ingrediente_id, estoque_lote_id, batch_code,
    manufactured_at, expires_at, quantity_initial, quantity_current,
    unit_cost, traceability_code, status
  ) values (
    new.empresa_id, new.ingrediente_id, new.id, new.numero_lote,
    new.data_fabricacao, new.data_validade, new.quantidade_inicial,
    new.quantidade_atual, new.custo_unitario, new.codigo_rastreabilidade, v_status
  )
  on conflict (estoque_lote_id) where estoque_lote_id is not null
  do update set
    batch_code = excluded.batch_code,
    manufactured_at = excluded.manufactured_at,
    expires_at = excluded.expires_at,
    quantity_initial = excluded.quantity_initial,
    quantity_current = excluded.quantity_current,
    unit_cost = excluded.unit_cost,
    traceability_code = excluded.traceability_code,
    status = excluded.status,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists estoque_lotes_after_write_inventory_batch on public.estoque_lotes;
create trigger estoque_lotes_after_write_inventory_batch
  after insert or update on public.estoque_lotes
  for each row execute function public.estoque_lotes_sync_inventory_batch();

-- ---------------------------------------------------------------------------
-- Registrar perda: grava inventory_losses + saída de estoque
-- ---------------------------------------------------------------------------
create or replace function public.fn_registrar_perda_estoque(
  p_empresa_id uuid,
  p_ingrediente_id uuid,
  p_quantity numeric,
  p_reason text,
  p_notes text default null,
  p_estoque_lote_id uuid default null,
  p_batch_id uuid default null,
  p_lost_at date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_custo numeric(14, 4);
  v_mov_id uuid;
  v_loss_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantidade da perda deve ser maior que zero';
  end if;

  if p_reason not in ('quebra', 'vencimento', 'desperdicio', 'producao', 'outro') then
    raise exception 'Motivo de perda inválido';
  end if;

  select coalesce(custo_medio_ponderado, 0) into v_custo
  from public.estoque_saldos
  where empresa_id = p_empresa_id and ingrediente_id = p_ingrediente_id;

  if v_custo is null then
    select coalesce(custo_unitario_atual, 0) into v_custo
    from public.ingredientes where id = p_ingrediente_id;
  end if;

  perform public.fn_registrar_saida_estoque(
    p_ingrediente_id,
    p_quantity,
    'saida',
    'ajuste',
    null,
    coalesce(p_notes, 'Perda: ' || p_reason)
  );

  select id into v_mov_id
  from public.estoque_movimentacoes
  where empresa_id = p_empresa_id
    and ingrediente_id = p_ingrediente_id
    and tipo in ('saida', 'ajuste_saida')
  order by criado_em desc
  limit 1;

  insert into public.inventory_losses (
    empresa_id, ingrediente_id, batch_id, estoque_lote_id,
    reason, quantity, unit_cost, lost_at, notes, movimentacao_id, created_by
  ) values (
    p_empresa_id, p_ingrediente_id, p_batch_id, p_estoque_lote_id,
    p_reason, p_quantity, coalesce(v_custo, 0), coalesce(p_lost_at, current_date),
    p_notes, v_mov_id, auth.uid()
  )
  returning id into v_loss_id;

  return v_loss_id;
end;
$$;

grant execute on function public.fn_registrar_perda_estoque(uuid, uuid, numeric, text, text, uuid, uuid, date)
  to authenticated;
revoke execute on function public.fn_registrar_perda_estoque(uuid, uuid, numeric, text, text, uuid, uuid, date)
  from public, anon;
