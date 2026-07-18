-- Sprint 05: Caixa. Independente de pedidos/PDV no schema (um caixa pode
-- registrar sangria/suprimento sem nenhum pedido) — o vínculo com vendas do
-- PDV acontece via pagamentos.caixa_id (0032), não aqui.

create table public.caixas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  operador_id uuid not null references public.profiles (id),
  status text not null default 'aberto' check (status in ('aberto', 'fechado')),
  saldo_inicial numeric(14, 2) not null default 0 check (saldo_inicial >= 0),
  -- Calculado só no fechamento, a partir de caixa_movimentacoes (ver
  -- fn_fechar_caixa) — soma apenas movimentos em dinheiro, já que cartão/PIX
  -- não afetam o dinheiro físico na gaveta.
  saldo_esperado numeric(14, 2),
  saldo_informado numeric(14, 2),
  diferenca numeric(14, 2) generated always as (saldo_informado - saldo_esperado) stored,
  observacoes_abertura text,
  observacoes_fechamento text,
  aberto_em timestamptz not null default now(),
  fechado_em timestamptz
);

-- Um operador só pode ter um caixa aberto por vez (múltiplos operadores da
-- mesma empresa podem ter caixas abertos simultâneos — vários terminais).
create unique index caixas_operador_aberto_key
  on public.caixas (operador_id)
  where status = 'aberto';
create index caixas_empresa_status_idx on public.caixas (empresa_id, status, aberto_em desc);

alter table public.caixas enable row level security;

create policy "caixas_select_own" on public.caixas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "caixas_insert_own" on public.caixas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "caixas_update_own" on public.caixas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create table public.caixa_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  caixa_id uuid not null references public.caixas (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'sangria', 'suprimento', 'venda')),
  valor numeric(14, 2) not null check (valor > 0),
  forma_pagamento text check (
    forma_pagamento in ('dinheiro', 'pix', 'debito', 'credito', 'vale', 'pagamento_entrega')
  ),
  -- Mesmo padrão polimórfico-leve de estoque_movimentacoes (0013): referencia
  -- o pedido/pagamento de origem quando tipo = 'venda', sem FK real.
  referencia_tipo text check (referencia_tipo in ('pedido', 'manual')),
  referencia_id uuid,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index caixa_movimentacoes_caixa_idx on public.caixa_movimentacoes (caixa_id, criado_em);

alter table public.caixa_movimentacoes enable row level security;

-- Append-only: SELECT/INSERT, nunca UPDATE/DELETE — mesmo motivo de
-- estoque_movimentacoes (0013).
create policy "caixa_movimentacoes_select_own" on public.caixa_movimentacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "caixa_movimentacoes_insert_own" on public.caixa_movimentacoes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.fn_abrir_caixa(
  p_empresa_id uuid,
  p_saldo_inicial numeric,
  p_observacoes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caixa_id uuid;
begin
  if p_saldo_inicial < 0 then
    raise exception 'Saldo inicial não pode ser negativo';
  end if;

  if exists (select 1 from public.caixas where operador_id = auth.uid() and status = 'aberto') then
    raise exception 'Você já tem um caixa aberto';
  end if;

  insert into public.caixas (empresa_id, operador_id, saldo_inicial, observacoes_abertura)
  values (p_empresa_id, auth.uid(), p_saldo_inicial, p_observacoes)
  returning id into v_caixa_id;

  return v_caixa_id;
end;
$$;

grant execute on function public.fn_abrir_caixa(uuid, numeric, text) to authenticated;
revoke execute on function public.fn_abrir_caixa(uuid, numeric, text) from public, anon;

create function public.fn_registrar_movimentacao_caixa(
  p_caixa_id uuid,
  p_tipo text,
  p_valor numeric,
  p_forma_pagamento text default null,
  p_referencia_tipo text default 'manual',
  p_referencia_id uuid default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_status text;
  v_movimentacao_id uuid;
begin
  if p_valor <= 0 then
    raise exception 'Valor da movimentação deve ser maior que zero';
  end if;

  select empresa_id, status into v_empresa_id, v_status from public.caixas where id = p_caixa_id;
  if v_empresa_id is null then
    raise exception 'Caixa não encontrado';
  end if;
  if v_status <> 'aberto' then
    raise exception 'Caixa já está fechado';
  end if;

  insert into public.caixa_movimentacoes (
    empresa_id, caixa_id, tipo, valor, forma_pagamento, referencia_tipo, referencia_id, observacao, criado_por
  ) values (
    v_empresa_id, p_caixa_id, p_tipo, p_valor, p_forma_pagamento, p_referencia_tipo, p_referencia_id, p_observacao, auth.uid()
  )
  returning id into v_movimentacao_id;

  return v_movimentacao_id;
end;
$$;

grant execute on function public.fn_registrar_movimentacao_caixa(
  uuid, text, numeric, text, text, uuid, text
) to authenticated;
revoke execute on function public.fn_registrar_movimentacao_caixa(
  uuid, text, numeric, text, text, uuid, text
) from public, anon;

create function public.fn_fechar_caixa(
  p_caixa_id uuid,
  p_saldo_informado numeric,
  p_observacoes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caixa public.caixas%rowtype;
  v_esperado numeric(14, 2);
begin
  select * into v_caixa from public.caixas where id = p_caixa_id;
  if not found then
    raise exception 'Caixa não encontrado';
  end if;
  if v_caixa.status <> 'aberto' then
    raise exception 'Caixa já está fechado';
  end if;

  select v_caixa.saldo_inicial
    + coalesce(sum(valor) filter (where tipo in ('entrada', 'suprimento')), 0)
    + coalesce(sum(valor) filter (where tipo = 'venda' and forma_pagamento = 'dinheiro'), 0)
    - coalesce(sum(valor) filter (where tipo = 'sangria'), 0)
  into v_esperado
  from public.caixa_movimentacoes
  where caixa_id = p_caixa_id;

  update public.caixas
  set
    status = 'fechado',
    saldo_esperado = v_esperado,
    saldo_informado = p_saldo_informado,
    observacoes_fechamento = p_observacoes,
    fechado_em = now()
  where id = p_caixa_id;
end;
$$;

grant execute on function public.fn_fechar_caixa(uuid, numeric, text) to authenticated;
revoke execute on function public.fn_fechar_caixa(uuid, numeric, text) from public, anon;
