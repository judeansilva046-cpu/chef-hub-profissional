/**
 * Espelha, em TypeScript, as MESMAS fórmulas implementadas em
 * supabase/migrations/0030_pedidos_core.sql (pedidos_calcular_total,
 * recalcular_subtotal_pedido e as colunas geradas de pedido_itens/
 * pedido_item_adicionais).
 *
 * Usado só para preview otimista no PDV/detalhe do pedido (atualização a
 * cada alteração de carrinho, sem round-trip ao banco). O banco continua
 * sendo a fonte de verdade — qualquer mudança de fórmula precisa ser
 * replicada nos dois lugares.
 */

export interface ItemPedidoCalculo {
  quantidade: number;
  precoUnitarioPraticado: number;
  descontoValor?: number;
}

export function calcularValorTotalItem(item: ItemPedidoCalculo): number {
  return item.quantidade * item.precoUnitarioPraticado - (item.descontoValor ?? 0);
}

export interface AdicionalPedidoCalculo {
  quantidade: number;
  precoUnitarioPraticado: number;
}

export function calcularValorTotalAdicional(adicional: AdicionalPedidoCalculo): number {
  return adicional.quantidade * adicional.precoUnitarioPraticado;
}

export function calcularSubtotalPedido(
  itens: ItemPedidoCalculo[],
  adicionais: AdicionalPedidoCalculo[] = [],
): number {
  const totalItens = itens.reduce((soma, item) => soma + calcularValorTotalItem(item), 0);
  const totalAdicionais = adicionais.reduce(
    (soma, adicional) => soma + calcularValorTotalAdicional(adicional),
    0,
  );
  return totalItens + totalAdicionais;
}

export interface TotalPedidoInput {
  subtotal: number;
  descontoPercentual: number;
  descontoValorFixo: number;
  acrescimoValor: number;
  taxaEntrega: number;
}

export function calcularTotalPedido(input: TotalPedidoInput): number {
  const total =
    input.subtotal -
    input.descontoValorFixo -
    (input.subtotal * input.descontoPercentual) / 100 +
    input.acrescimoValor +
    input.taxaEntrega;

  return Math.max(0, total);
}
