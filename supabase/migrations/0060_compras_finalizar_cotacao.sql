-- Sprint 08: finalização da cotação — depende de pedidos_compra já
-- estendido (0059), por isso é uma migration própria em vez de ir junto com
-- 0058 (compras_cotacoes é criada antes de pedidos_compra ganhar
-- cotacao_origem_id/centro_custo_id/plano_conta_id).

-- Escolha automática: menor custo total (itens + frete + impostos) entre os
-- fornecedores que propuseram TODOS os itens da cotação — um fornecedor que
-- só cobriu parte dos itens não é comparável em pé de igualdade e fica de
-- fora da escolha automática (ainda pode ser escolhido manualmente).
create function public.fn_escolher_melhor_proposta_cotacao(p_cotacao_id uuid)
returns uuid
language sql
stable
set search_path = public
as $$
  select cf.fornecedor_id
  from public.compras_cotacoes_fornecedores cf
  join public.compras_cotacoes_propostas_itens pi on pi.cotacao_fornecedor_id = cf.id
  where cf.cotacao_id = p_cotacao_id
  group by cf.id, cf.fornecedor_id, cf.valor_frete, cf.valor_impostos
  having count(*) = (select count(*) from public.compras_cotacoes_itens where cotacao_id = p_cotacao_id)
  order by sum(pi.preco_unitario * (
    select ci.quantidade from public.compras_cotacoes_itens ci where ci.id = pi.cotacao_item_id
  )) + cf.valor_frete + cf.valor_impostos asc
  limit 1;
$$;

grant execute on function public.fn_escolher_melhor_proposta_cotacao(uuid) to authenticated;
revoke execute on function public.fn_escolher_melhor_proposta_cotacao(uuid) from public, anon;

-- SECURITY INVOKER: todas as escritas (pedidos_compra, pedidos_compra_itens,
-- compras_cotacoes, compras_cotacoes_fornecedores, solicitacoes_compra) já
-- são permitidas pela RLS do próprio usuário — a função só garante que
-- acontecem atomicamente, mesmo motivo de fn_criar_conta_receber (0042) e
-- fn_converter_lead_em_cliente (0051).
create function public.fn_finalizar_cotacao(
  p_cotacao_id uuid,
  p_fornecedor_vencedor_id uuid,
  p_justificativa text default null,
  p_escolha_automatica boolean default false
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_cotacao record;
  v_cotacao_fornecedor record;
  v_pedido_id uuid;
begin
  select * into v_cotacao from public.compras_cotacoes where id = p_cotacao_id;
  if v_cotacao.id is null then
    raise exception 'Cotação não encontrada ou sem permissão.';
  end if;
  if v_cotacao.status not in ('aberta', 'em_andamento') then
    raise exception 'Só é possível finalizar cotações abertas ou em andamento.';
  end if;

  select * into v_cotacao_fornecedor
  from public.compras_cotacoes_fornecedores
  where cotacao_id = p_cotacao_id and fornecedor_id = p_fornecedor_vencedor_id;

  if v_cotacao_fornecedor.id is null then
    raise exception 'Fornecedor não foi convidado nesta cotação.';
  end if;

  if not p_escolha_automatica and (p_justificativa is null or btrim(p_justificativa) = '') then
    raise exception 'Informe a justificativa da escolha manual.';
  end if;

  insert into public.pedidos_compra (
    empresa_id, fornecedor_id, solicitacao_origem_id, cotacao_origem_id,
    valor_frete, valor_impostos, condicao_pagamento
  ) values (
    v_cotacao.empresa_id, p_fornecedor_vencedor_id, v_cotacao.solicitacao_origem_id, p_cotacao_id,
    v_cotacao_fornecedor.valor_frete, v_cotacao_fornecedor.valor_impostos, v_cotacao_fornecedor.condicao_pagamento
  )
  returning id into v_pedido_id;

  insert into public.pedidos_compra_itens (pedido_id, ingrediente_id, quantidade_pedida, preco_unitario)
  select v_pedido_id, ci.ingrediente_id, ci.quantidade, pi.preco_unitario
  from public.compras_cotacoes_itens ci
  join public.compras_cotacoes_propostas_itens pi
    on pi.cotacao_item_id = ci.id and pi.cotacao_fornecedor_id = v_cotacao_fornecedor.id
  where ci.cotacao_id = p_cotacao_id;

  update public.compras_cotacoes_fornecedores
  set status = case when id = v_cotacao_fornecedor.id then 'vencedor' else 'recusado' end
  where cotacao_id = p_cotacao_id;

  update public.compras_cotacoes
  set status = 'finalizada', fornecedor_vencedor_id = p_fornecedor_vencedor_id,
      justificativa_escolha = p_justificativa, escolha_automatica = p_escolha_automatica,
      finalizado_em = now()
  where id = p_cotacao_id;

  if v_cotacao.solicitacao_origem_id is not null then
    update public.solicitacoes_compra set status = 'convertida' where id = v_cotacao.solicitacao_origem_id;
  end if;

  return v_pedido_id;
end;
$$;

grant execute on function public.fn_finalizar_cotacao(uuid, uuid, text, boolean) to authenticated;
revoke execute on function public.fn_finalizar_cotacao(uuid, uuid, text, boolean) from public, anon;
