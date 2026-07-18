-- Controle de Estoque: lotes (FIFO + validade), movimentações (auditoria
-- append-only) e saldos (cache agregado por ingrediente, mantido por
-- trigger). Custo médio ponderado é uma métrica DERIVADA dos lotes atuais
-- (não um método de custeio alternativo) — quem governa o valor de cada
-- saída é sempre o FIFO dos lotes.

alter table public.ingredientes
  add column estoque_minimo numeric(14, 4) not null default 0 check (estoque_minimo >= 0);

create table public.estoque_lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  numero_lote text,
  quantidade_inicial numeric(14, 4) not null check (quantidade_inicial > 0),
  quantidade_atual numeric(14, 4) not null check (quantidade_atual >= 0),
  custo_unitario numeric(14, 4) not null check (custo_unitario >= 0),
  data_entrada timestamptz not null default now(),
  data_validade date,
  created_at timestamptz not null default now()
);

create index estoque_lotes_ingrediente_fifo_idx
  on public.estoque_lotes (ingrediente_id, data_entrada, id)
  where quantidade_atual > 0;
create index estoque_lotes_empresa_idx on public.estoque_lotes (empresa_id);
create index estoque_lotes_validade_idx
  on public.estoque_lotes (empresa_id, data_validade)
  where quantidade_atual > 0 and data_validade is not null;

alter table public.estoque_lotes enable row level security;

-- SELECT/INSERT/UPDATE (não DELETE — histórico de lotes é permanente,
-- mesmo esgotados). UPDATE só é usado internamente para decrementar
-- quantidade_atual ao consumir via FIFO.
create policy "estoque_lotes_select_own" on public.estoque_lotes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "estoque_lotes_insert_own" on public.estoque_lotes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "estoque_lotes_update_own" on public.estoque_lotes
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create table public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  lote_id uuid references public.estoque_lotes (id) on delete set null,
  tipo text not null check (tipo in ('entrada', 'saida', 'ajuste_entrada', 'ajuste_saida', 'inventario')),
  quantidade numeric(14, 4) not null check (quantidade > 0),
  custo_unitario numeric(14, 4) not null check (custo_unitario >= 0),
  -- Referência "polimórfica" leve: sem FK real (aponta para compra, produção,
  -- inventário ou nada/manual), documentado — não vale a pena uma tabela de
  -- junção separada só para isto nesta fase.
  referencia_tipo text check (referencia_tipo in ('compra', 'producao', 'ajuste', 'inventario', 'manual')),
  referencia_id uuid,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index estoque_movimentacoes_empresa_idx
  on public.estoque_movimentacoes (empresa_id, criado_em desc);
create index estoque_movimentacoes_ingrediente_idx
  on public.estoque_movimentacoes (ingrediente_id, criado_em desc);
create index estoque_movimentacoes_referencia_idx
  on public.estoque_movimentacoes (referencia_tipo, referencia_id);

alter table public.estoque_movimentacoes enable row level security;

-- Append-only: SELECT/INSERT, nunca UPDATE/DELETE.
create policy "estoque_movimentacoes_select_own" on public.estoque_movimentacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "estoque_movimentacoes_insert_own" on public.estoque_movimentacoes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create table public.estoque_saldos (
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  quantidade_total numeric(14, 4) not null default 0,
  custo_medio_ponderado numeric(14, 4) not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id, ingrediente_id)
);

alter table public.estoque_saldos enable row level security;

-- Só SELECT para authenticated: é cache derivado, mantido exclusivamente
-- pela trigger abaixo (SECURITY DEFINER).
create policy "estoque_saldos_select_own" on public.estoque_saldos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- SECURITY DEFINER: só grava um agregado recalculado a partir de
-- estoque_lotes (dado já autorizado pela RLS de quem disparou a escrita
-- original) — não aceita nenhum input arbitrário do cliente.
create function public.fn_recalcular_estoque_saldo(p_ingrediente_id uuid, p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quantidade numeric(14, 4);
  v_custo_medio numeric(14, 4);
begin
  select
    coalesce(sum(quantidade_atual), 0),
    case when coalesce(sum(quantidade_atual), 0) > 0
      then sum(quantidade_atual * custo_unitario) / sum(quantidade_atual)
      else 0
    end
  into v_quantidade, v_custo_medio
  from public.estoque_lotes
  where ingrediente_id = p_ingrediente_id and quantidade_atual > 0;

  insert into public.estoque_saldos (empresa_id, ingrediente_id, quantidade_total, custo_medio_ponderado, atualizado_em)
  values (p_empresa_id, p_ingrediente_id, v_quantidade, v_custo_medio, now())
  on conflict (empresa_id, ingrediente_id)
  do update set
    quantidade_total = excluded.quantidade_total,
    custo_medio_ponderado = excluded.custo_medio_ponderado,
    atualizado_em = now();
end;
$$;

create function public.fn_estoque_lotes_recalcular_saldo()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.fn_recalcular_estoque_saldo(old.ingrediente_id, old.empresa_id);
    return old;
  end if;

  perform public.fn_recalcular_estoque_saldo(new.ingrediente_id, new.empresa_id);
  return new;
end;
$$;

create trigger estoque_lotes_after_change
  after insert or update or delete on public.estoque_lotes
  for each row execute function public.fn_estoque_lotes_recalcular_saldo();
