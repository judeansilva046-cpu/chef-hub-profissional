-- Sprint 06: Contas a Receber com parcelamento — cobre o cenário que
-- `vendas` (0027, à vista/instantânea) e `pagamentos` de pedidos (0032,
-- pagamento imediato no PDV) não cobrem: venda a prazo/parcelada,
-- faturamento B2B, cobrança com vencimento futuro. Não substitui nem
-- duplica nenhum dos dois — é um terceiro cenário financeiro.
create table public.contas_receber (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  plano_conta_id uuid references public.plano_contas (id) on delete set null,
  centro_custo_id uuid references public.centros_custo (id) on delete set null,
  descricao text not null,
  -- Referência polimórfica leve (mesmo padrão de estoque_movimentacoes,
  -- 0013): rastreia o pedido/venda de origem quando houver, sem FK real —
  -- contas_receber é standalone, não depende de pedidos existir.
  referencia_tipo text check (referencia_tipo in ('pedido', 'venda')),
  referencia_id uuid,
  valor_total numeric(14, 2) not null check (valor_total > 0),
  numero_parcelas integer not null default 1 check (numero_parcelas > 0),
  data_emissao date not null default current_date,
  -- Derivado das parcelas pela trigger abaixo — nunca escrito diretamente.
  status text not null default 'pendente' check (
    status in ('pendente', 'recebido_parcial', 'recebido', 'cancelado')
  ),
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index contas_receber_empresa_status_idx on public.contas_receber (empresa_id, status);
create index contas_receber_cliente_idx on public.contas_receber (cliente_id) where cliente_id is not null;

alter table public.contas_receber enable row level security;

create policy "contas_receber_select_own" on public.contas_receber
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "contas_receber_insert_own" on public.contas_receber
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "contas_receber_update_own" on public.contas_receber
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger contas_receber_set_atualizado_em
  before update on public.contas_receber
  for each row execute function public.set_atualizado_em();

create table public.contas_receber_parcelas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  conta_receber_id uuid not null references public.contas_receber (id) on delete cascade,
  numero_parcela integer not null check (numero_parcela > 0),
  valor numeric(14, 2) not null check (valor > 0),
  data_vencimento date not null,
  data_recebimento date,
  valor_recebido numeric(14, 2) check (valor_recebido is null or valor_recebido >= 0),
  forma_pagamento text check (
    forma_pagamento in ('pix', 'cartao', 'dinheiro', 'boleto', 'transferencia')
  ),
  status text not null default 'pendente' check (status in ('pendente', 'recebido', 'cancelado')),
  conciliado boolean not null default false,
  conciliado_em timestamptz,
  conciliado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create unique index contas_receber_parcelas_numero_key
  on public.contas_receber_parcelas (conta_receber_id, numero_parcela);
create index contas_receber_parcelas_empresa_status_idx
  on public.contas_receber_parcelas (empresa_id, status, data_vencimento);

alter table public.contas_receber_parcelas enable row level security;

create policy "contas_receber_parcelas_select_own" on public.contas_receber_parcelas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
-- NOTA (corrigida na migration 0043): faltou uma policy de INSERT aqui —
-- fn_criar_conta_receber é SECURITY INVOKER, então precisa de uma policy
-- de INSERT para o próprio caminho "único" funcionar. A 0043 adiciona
-- "contas_receber_parcelas_insert" ao trocar todas as policies destas
-- tabelas para fn_tem_acesso_financeiro (parte do módulo de Permissões).
create policy "contas_receber_parcelas_update_own" on public.contas_receber_parcelas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Cria a conta a receber e já divide o valor em N parcelas mensais iguais
-- (a última absorve o resto do arredondamento) — mesma atomicidade de
-- fn_emitir_etiqueta (0028): sem isso, uma falha no meio deixaria uma conta
-- sem parcela ou parcelas sem conta.
create function public.fn_criar_conta_receber(
  p_empresa_id uuid,
  p_descricao text,
  p_valor_total numeric,
  p_numero_parcelas integer,
  p_primeira_data_vencimento date,
  p_cliente_id uuid default null,
  p_plano_conta_id uuid default null,
  p_centro_custo_id uuid default null,
  p_referencia_tipo text default null,
  p_referencia_id uuid default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_conta_id uuid;
  v_valor_parcela numeric(14, 2);
  v_valor_acumulado numeric(14, 2) := 0;
  v_i integer;
begin
  if p_valor_total <= 0 then
    raise exception 'Valor total deve ser maior que zero';
  end if;
  if p_numero_parcelas <= 0 then
    raise exception 'Número de parcelas deve ser maior que zero';
  end if;

  insert into public.contas_receber (
    empresa_id, cliente_id, plano_conta_id, centro_custo_id, descricao,
    referencia_tipo, referencia_id, valor_total, numero_parcelas, observacao, criado_por
  ) values (
    p_empresa_id, p_cliente_id, p_plano_conta_id, p_centro_custo_id, p_descricao,
    p_referencia_tipo, p_referencia_id, p_valor_total, p_numero_parcelas, p_observacao, auth.uid()
  )
  returning id into v_conta_id;

  v_valor_parcela := trunc(p_valor_total / p_numero_parcelas, 2);

  for v_i in 1..p_numero_parcelas loop
    insert into public.contas_receber_parcelas (
      empresa_id, conta_receber_id, numero_parcela, valor, data_vencimento
    ) values (
      p_empresa_id, v_conta_id, v_i,
      case when v_i = p_numero_parcelas then p_valor_total - v_valor_acumulado else v_valor_parcela end,
      p_primeira_data_vencimento + make_interval(months => v_i - 1)
    );
    v_valor_acumulado := v_valor_acumulado + v_valor_parcela;
  end loop;

  return v_conta_id;
end;
$$;

grant execute on function public.fn_criar_conta_receber(
  uuid, text, numeric, integer, date, uuid, uuid, uuid, text, uuid, text
) to authenticated;
revoke execute on function public.fn_criar_conta_receber(
  uuid, text, numeric, integer, date, uuid, uuid, uuid, text, uuid, text
) from public, anon;

create function public.fn_registrar_recebimento_parcela(
  p_parcela_id uuid,
  p_valor_recebido numeric,
  p_forma_pagamento text,
  p_data_recebimento date default current_date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.contas_receber_parcelas where id = p_parcela_id;
  if v_status is null then
    raise exception 'Parcela não encontrada';
  end if;
  if v_status <> 'pendente' then
    raise exception 'Só é possível registrar recebimento de uma parcela pendente';
  end if;
  if p_valor_recebido <= 0 then
    raise exception 'Valor recebido deve ser maior que zero';
  end if;

  update public.contas_receber_parcelas
  set
    status = 'recebido',
    valor_recebido = p_valor_recebido,
    forma_pagamento = p_forma_pagamento,
    data_recebimento = p_data_recebimento
  where id = p_parcela_id;
end;
$$;

grant execute on function public.fn_registrar_recebimento_parcela(uuid, numeric, text, date) to authenticated;
revoke execute on function public.fn_registrar_recebimento_parcela(uuid, numeric, text, date) from public, anon;

-- Recalcula o status da conta-mãe a partir das parcelas — idempotente,
-- mesmo padrão de recalcular_ficha_tecnica (0009): sempre reconta o estado
-- atual, nunca incrementa/decrementa.
create function public.recalcular_status_conta_receber(p_conta_receber_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_total integer;
  v_recebidas integer;
  v_canceladas integer;
  v_novo_status text;
begin
  select count(*), count(*) filter (where status = 'recebido'), count(*) filter (where status = 'cancelado')
  into v_total, v_recebidas, v_canceladas
  from public.contas_receber_parcelas
  where conta_receber_id = p_conta_receber_id;

  v_novo_status := case
    when v_canceladas = v_total then 'cancelado'
    when v_recebidas + v_canceladas = v_total then 'recebido'
    when v_recebidas > 0 then 'recebido_parcial'
    else 'pendente'
  end;

  update public.contas_receber set status = v_novo_status where id = p_conta_receber_id;
end;
$$;

create function public.contas_receber_parcelas_after_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.recalcular_status_conta_receber(new.conta_receber_id);
  return new;
end;
$$;

create trigger contas_receber_parcelas_after_update_recalcular
  after update on public.contas_receber_parcelas
  for each row execute function public.contas_receber_parcelas_after_update();

create function public.fn_cancelar_conta_receber(p_conta_receber_id uuid, p_motivo text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Motivo do cancelamento é obrigatório';
  end if;

  update public.contas_receber_parcelas
  set status = 'cancelado'
  where conta_receber_id = p_conta_receber_id and status = 'pendente';

  update public.contas_receber
  set observacao = coalesce(observacao || ' | ', '') || 'Cancelado: ' || p_motivo
  where id = p_conta_receber_id;
end;
$$;

grant execute on function public.fn_cancelar_conta_receber(uuid, text) to authenticated;
revoke execute on function public.fn_cancelar_conta_receber(uuid, text) from public, anon;
