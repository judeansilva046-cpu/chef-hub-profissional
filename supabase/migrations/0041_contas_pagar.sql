-- Sprint 06: Contas a Pagar — a peça que faltava entre Compras (0017, só
-- recebimento físico em estoque, sem rastro financeiro) e Financeiro (0024,
-- só templates recorrentes mensais, sem obrigação real com vencimento).
--
-- "atrasado" NÃO é um status persistido: seria um valor que fica velho
-- sozinho sem um job para recalcular. É sempre derivado
-- (status='pendente' and data_vencimento < hoje), calculado na camada de
-- consulta — mesmo raciocínio de nunca persistir o que dá pra derivar.
create table public.contas_pagar (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  plano_conta_id uuid references public.plano_contas (id) on delete set null,
  centro_custo_id uuid references public.centros_custo (id) on delete set null,
  descricao text not null,
  -- Origem: de onde a obrigação veio — só para a UI explicar/filtrar, sem
  -- efeito de negócio próprio.
  categoria_origem text not null default 'manual' check (
    categoria_origem in ('compra', 'despesa_fixa', 'manual')
  ),
  -- Referência polimórfica leve (mesmo padrão de estoque_movimentacoes,
  -- 0013): aponta pro pedido_compra ou custo_fixo de origem, sem FK real.
  referencia_tipo text check (referencia_tipo in ('pedido_compra', 'custo_fixo')),
  referencia_id uuid,
  numero_documento text,
  valor numeric(14, 2) not null check (valor > 0),
  data_emissao date not null default current_date,
  data_vencimento date not null,
  data_pagamento date,
  valor_pago numeric(14, 2) check (valor_pago is null or valor_pago >= 0),
  forma_pagamento text check (
    forma_pagamento in ('pix', 'boleto', 'dinheiro', 'cartao', 'transferencia')
  ),
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  conciliado boolean not null default false,
  conciliado_em timestamptz,
  conciliado_por uuid references public.profiles (id),
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index contas_pagar_empresa_status_idx on public.contas_pagar (empresa_id, status, data_vencimento);
create index contas_pagar_empresa_vencimento_idx on public.contas_pagar (empresa_id, data_vencimento);
create index contas_pagar_fornecedor_idx on public.contas_pagar (fornecedor_id) where fornecedor_id is not null;
create index contas_pagar_referencia_idx on public.contas_pagar (referencia_tipo, referencia_id) where referencia_id is not null;
-- Evita gerar duas contas a pagar do mesmo custo fixo no mesmo mês ao rodar
-- fn_gerar_contas_pagar_do_mes mais de uma vez.
create unique index contas_pagar_referencia_unica_key
  on public.contas_pagar (referencia_tipo, referencia_id, data_vencimento)
  where referencia_tipo is not null;

alter table public.contas_pagar enable row level security;

-- Sem DELETE: conta paga é histórico financeiro real — "remover" antes de
-- pagar é cancelar (status='cancelado'), depois de pago não se remove.
create policy "contas_pagar_select_own" on public.contas_pagar
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "contas_pagar_insert_own" on public.contas_pagar
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "contas_pagar_update_own" on public.contas_pagar
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger contas_pagar_set_atualizado_em
  before update on public.contas_pagar
  for each row execute function public.set_atualizado_em();

create function public.fn_registrar_pagamento_conta_pagar(
  p_conta_pagar_id uuid,
  p_valor_pago numeric,
  p_forma_pagamento text,
  p_data_pagamento date default current_date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.contas_pagar where id = p_conta_pagar_id;
  if v_status is null then
    raise exception 'Conta a pagar não encontrada';
  end if;
  if v_status <> 'pendente' then
    raise exception 'Só é possível registrar pagamento de uma conta pendente';
  end if;
  if p_valor_pago <= 0 then
    raise exception 'Valor pago deve ser maior que zero';
  end if;

  update public.contas_pagar
  set
    status = 'pago',
    valor_pago = p_valor_pago,
    forma_pagamento = p_forma_pagamento,
    data_pagamento = p_data_pagamento
  where id = p_conta_pagar_id;
end;
$$;

grant execute on function public.fn_registrar_pagamento_conta_pagar(uuid, numeric, text, date) to authenticated;
revoke execute on function public.fn_registrar_pagamento_conta_pagar(uuid, numeric, text, date) from public, anon;

create function public.fn_cancelar_conta_pagar(p_conta_pagar_id uuid, p_motivo text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Motivo do cancelamento é obrigatório';
  end if;

  select status into v_status from public.contas_pagar where id = p_conta_pagar_id;
  if v_status is null then
    raise exception 'Conta a pagar não encontrada';
  end if;
  if v_status = 'pago' then
    raise exception 'Não é possível cancelar uma conta já paga';
  end if;

  update public.contas_pagar
  set status = 'cancelado', observacao = coalesce(observacao || ' | ', '') || 'Cancelado: ' || p_motivo
  where id = p_conta_pagar_id;
end;
$$;

grant execute on function public.fn_cancelar_conta_pagar(uuid, text) to authenticated;
revoke execute on function public.fn_cancelar_conta_pagar(uuid, text) from public, anon;

-- Gera uma conta a pagar por custo fixo ativo para o mês informado —
-- idempotente (o índice único de referência bloqueia duplicata se rodar de
-- novo pro mesmo mês). Vencimento default: dia 10 do mês de referência
-- (convenção simples; ajustável por conta depois de gerada).
create function public.fn_gerar_contas_pagar_do_mes(p_empresa_id uuid, p_mes_referencia date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_custo record;
  v_vencimento date;
  v_gerados integer := 0;
begin
  v_vencimento := date_trunc('month', p_mes_referencia)::date + interval '9 days';

  for v_custo in
    select id, nome, valor_mensal from public.custos_fixos
    where empresa_id = p_empresa_id and ativo
  loop
    begin
      insert into public.contas_pagar (
        empresa_id, descricao, categoria_origem, referencia_tipo, referencia_id,
        valor, data_vencimento
      ) values (
        p_empresa_id, v_custo.nome, 'despesa_fixa', 'custo_fixo', v_custo.id,
        v_custo.valor_mensal, v_vencimento
      );
      v_gerados := v_gerados + 1;
    exception when unique_violation then
      -- já gerada para este custo fixo neste mês, ignora.
      null;
    end;
  end loop;

  return v_gerados;
end;
$$;

grant execute on function public.fn_gerar_contas_pagar_do_mes(uuid, date) to authenticated;
revoke execute on function public.fn_gerar_contas_pagar_do_mes(uuid, date) from public, anon;

-- Ao receber (total ou parcialmente) um pedido de compra, gera/atualiza a
-- conta a pagar correspondente — reaproveita fn_receber_item_pedido_compra
-- (0017) como único gatilho, sem duplicar a lógica de recebimento.
create function public.pedidos_compra_criar_conta_pagar()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_valor_total numeric(14, 2);
begin
  if new.status in ('parcialmente_recebido', 'recebido')
    and old.status not in ('parcialmente_recebido', 'recebido') then
    select coalesce(sum(valor_total), 0) into v_valor_total
    from public.pedidos_compra_itens
    where pedido_id = new.id;

    insert into public.contas_pagar (
      empresa_id, fornecedor_id, descricao, categoria_origem, referencia_tipo, referencia_id,
      valor, data_vencimento
    ) values (
      new.empresa_id, new.fornecedor_id, 'Pedido de compra #' || substr(new.id::text, 1, 8),
      'compra', 'pedido_compra', new.id,
      v_valor_total, coalesce(new.data_prevista_entrega, current_date + interval '30 days')
    )
    on conflict (referencia_tipo, referencia_id, data_vencimento) do nothing;
  end if;
  return new;
end;
$$;

create trigger pedidos_compra_after_update_criar_conta_pagar
  after update on public.pedidos_compra
  for each row execute function public.pedidos_compra_criar_conta_pagar();
