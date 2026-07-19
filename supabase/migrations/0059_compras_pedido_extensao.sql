-- Sprint 08: extensão de pedidos_compra (0017) — número, origem por
-- cotação, desconto/frete/impostos/condição de pagamento/parcelas (mesmo
-- vocabulário de desconto já usado em `pedidos`, 0030, para venda — não um
-- esquema novo), centro de custo/plano de conta (para a conta a pagar
-- gerada já nascer classificada) e aprovação leve do pedido em si (distinta
-- da aprovação da solicitação de origem, módulo 4).
alter table public.pedidos_compra drop constraint pedidos_compra_status_check;
alter table public.pedidos_compra add constraint pedidos_compra_status_check
  check (status in (
    'rascunho', 'aguardando_aprovacao', 'aprovado', 'enviado',
    'parcialmente_recebido', 'recebido', 'cancelado'
  ));

alter table public.pedidos_compra
  add column numero integer,
  add column cotacao_origem_id uuid references public.compras_cotacoes (id) on delete set null,
  add column centro_custo_id uuid references public.centros_custo (id) on delete set null,
  add column plano_conta_id uuid references public.plano_contas (id) on delete set null,
  add column desconto_percentual numeric(5, 2) not null default 0 check (desconto_percentual >= 0 and desconto_percentual <= 100),
  add column desconto_valor_fixo numeric(14, 2) not null default 0 check (desconto_valor_fixo >= 0),
  add column valor_frete numeric(14, 2) not null default 0 check (valor_frete >= 0),
  add column valor_impostos numeric(14, 2) not null default 0 check (valor_impostos >= 0),
  add column condicao_pagamento text,
  add column numero_parcelas integer not null default 1 check (numero_parcelas > 0),
  add column subtotal numeric(14, 2) not null default 0,
  add column total numeric(14, 2) not null default 0,
  add column aprovado_por uuid references public.profiles (id),
  add column aprovado_em timestamptz;

create unique index pedidos_compra_empresa_numero_key on public.pedidos_compra (empresa_id, numero);
create index pedidos_compra_cotacao_origem_idx on public.pedidos_compra (cotacao_origem_id) where cotacao_origem_id is not null;
create index pedidos_compra_centro_custo_idx on public.pedidos_compra (centro_custo_id) where centro_custo_id is not null;

create function public.pedidos_compra_definir_numero()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.fn_proximo_numero_compras(new.empresa_id, 'pedido');
  end if;
  return new;
end;
$$;

create trigger pedidos_compra_before_insert_definir_numero
  before insert on public.pedidos_compra
  for each row execute function public.pedidos_compra_definir_numero();

-- Total sempre recalculado (mesmo padrão de pedidos_calcular_total, 0030) —
-- subtotal vem dos itens (trigger abaixo), o resto é aritmética simples.
create function public.pedidos_compra_calcular_total()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.total := greatest(
    0,
    new.subtotal
      - new.desconto_valor_fixo
      - (new.subtotal * new.desconto_percentual / 100)
      + new.valor_frete
      + new.valor_impostos
  );
  return new;
end;
$$;

create trigger pedidos_compra_before_upsert_calcular_total
  before insert or update on public.pedidos_compra
  for each row execute function public.pedidos_compra_calcular_total();

-- Recalcula subtotal a partir dos itens reais, idempotente (mesmo padrão de
-- recalcular_subtotal_pedido, 0030) — nunca incrementa/decrementa.
create function public.recalcular_subtotal_pedido_compra(p_pedido_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_subtotal numeric(14, 2);
begin
  select coalesce(sum(valor_total), 0) into v_subtotal
  from public.pedidos_compra_itens
  where pedido_id = p_pedido_id;

  update public.pedidos_compra set subtotal = v_subtotal where id = p_pedido_id;
end;
$$;

create function public.pedidos_compra_itens_after_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recalcular_subtotal_pedido_compra(old.pedido_id);
    return old;
  end if;

  perform public.recalcular_subtotal_pedido_compra(new.pedido_id);
  return new;
end;
$$;

create trigger pedidos_compra_itens_after_change_recalcular
  after insert or update or delete on public.pedidos_compra_itens
  for each row execute function public.pedidos_compra_itens_after_change();

-- Histórico de status: mesmo padrão de pedido_status_historico (0030) e
-- solicitacoes_compra_historico (0056).
create table public.pedidos_compra_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos_compra (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  motivo text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index pedidos_compra_historico_pedido_idx on public.pedidos_compra_historico (pedido_id, criado_em);

alter table public.pedidos_compra_historico enable row level security;

create policy "pedidos_compra_historico_select_own" on public.pedidos_compra_historico
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.pedidos_compra_registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.pedidos_compra_historico (empresa_id, pedido_id, status_anterior, status_novo, criado_por)
    values (new.empresa_id, new.id, null, new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.pedidos_compra_historico (empresa_id, pedido_id, status_anterior, status_novo, criado_por)
    values (new.empresa_id, new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

revoke execute on function public.pedidos_compra_registrar_historico() from public, anon, authenticated;

create trigger pedidos_compra_after_change_historico
  after insert or update on public.pedidos_compra
  for each row execute function public.pedidos_compra_registrar_historico();

-- Aprovação leve do PEDIDO (distinta da aprovação da solicitação de
-- origem, 0057) — reaproveita o mesmo critério "dono ou papel aprovador/
-- comprador", sem faixas de valor configuráveis (o pedido já nasce de uma
-- solicitação aprovada ou de uma cotação finalizada — a decisão de valor já
-- foi tomada lá; esta é só uma checagem final antes de enviar ao
-- fornecedor).
create function public.fn_aprovar_pedido_compra(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_status text;
  v_dono boolean;
  v_papel text;
begin
  select empresa_id, status into v_empresa_id, v_status
  from public.pedidos_compra where id = p_pedido_id;

  if v_empresa_id is null then
    raise exception 'Pedido de compra não encontrado.';
  end if;
  if v_status <> 'aguardando_aprovacao' then
    raise exception 'Só é possível aprovar pedidos aguardando aprovação.';
  end if;

  select exists(select 1 from public.empresas where id = v_empresa_id and usuario_id = auth.uid()) into v_dono;

  if not v_dono then
    select papel into v_papel from public.usuarios_empresa
    where empresa_id = v_empresa_id and usuario_id = auth.uid() and ativo;

    if v_papel not in ('aprovador', 'comprador') then
      raise exception 'Você não tem papel de aprovador para pedidos de compra.';
    end if;
  end if;

  update public.pedidos_compra
  set status = 'aprovado', aprovado_por = auth.uid(), aprovado_em = now()
  where id = p_pedido_id;
end;
$$;

grant execute on function public.fn_aprovar_pedido_compra(uuid) to authenticated;
revoke execute on function public.fn_aprovar_pedido_compra(uuid) from public, anon;

-- Substitui pedidos_compra_criar_conta_pagar (0041): agora gera 1..N
-- parcelas (igual fn_criar_conta_receber, 0042 — última parcela absorve o
-- resto do arredondamento), já classificadas por centro de custo/plano de
-- conta quando o pedido os tiver, e cancela as contas a pagar vinculadas se
-- o pedido for cancelado depois de já ter gerado alguma.
drop trigger pedidos_compra_after_update_criar_conta_pagar on public.pedidos_compra;
drop function public.pedidos_compra_criar_conta_pagar();

create function public.pedidos_compra_sincronizar_conta_pagar()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_parcela integer;
  v_valor_parcela numeric(14, 2);
  v_valor_ultima_parcela numeric(14, 2);
  v_vencimento_base date;
begin
  if new.status in ('parcialmente_recebido', 'recebido')
    and old.status not in ('parcialmente_recebido', 'recebido')
    and not exists (
      select 1 from public.contas_pagar
      where referencia_tipo = 'pedido_compra' and referencia_id = new.id
    ) then
    v_vencimento_base := coalesce(new.data_prevista_entrega, current_date);
    v_valor_parcela := round(new.total / new.numero_parcelas, 2);
    v_valor_ultima_parcela := new.total - v_valor_parcela * (new.numero_parcelas - 1);

    for v_parcela in 1..new.numero_parcelas loop
      insert into public.contas_pagar (
        empresa_id, fornecedor_id, plano_conta_id, centro_custo_id,
        descricao, categoria_origem, referencia_tipo, referencia_id,
        valor, data_vencimento
      ) values (
        new.empresa_id, new.fornecedor_id, new.plano_conta_id, new.centro_custo_id,
        'Pedido de compra #' || coalesce(new.numero::text, substr(new.id::text, 1, 8))
          || case when new.numero_parcelas > 1 then ' — parcela ' || v_parcela || '/' || new.numero_parcelas else '' end,
        'compra', 'pedido_compra', new.id,
        case when v_parcela = new.numero_parcelas then v_valor_ultima_parcela else v_valor_parcela end,
        v_vencimento_base + (interval '30 days' * (v_parcela - 1))
      );
    end loop;
  end if;

  if new.status = 'cancelado' and old.status <> 'cancelado' then
    update public.contas_pagar
    set status = 'cancelado', observacao = coalesce(observacao || ' | ', '') || 'Cancelado: pedido de compra cancelado'
    where referencia_tipo = 'pedido_compra' and referencia_id = new.id and status = 'pendente';
  end if;

  return new;
end;
$$;

create trigger pedidos_compra_after_update_sincronizar_conta_pagar
  after update on public.pedidos_compra
  for each row execute function public.pedidos_compra_sincronizar_conta_pagar();
