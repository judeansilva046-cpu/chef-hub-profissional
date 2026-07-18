/**
 * Espelha, em TypeScript, as MESMAS fórmulas implementadas em
 * supabase/migrations/0008_fichas_tecnicas.sql
 * (calcular_campos_derivados_ficha_tecnica) e
 * supabase/migrations/0009_fichas_tecnicas_itens.sql (colunas geradas).
 *
 * Usado SÓ para preview otimista no formulário (atualização a cada tecla,
 * sem round-trip ao banco). O banco continua sendo a fonte de verdade —
 * qualquer mudança de fórmula precisa ser replicada nos dois lugares. Ver
 * docs/DATABASE.md.
 */

export const MARGEM_CONTRIBUICAO_PADRAO_SISTEMA = 70;

export interface ItemCalculoInput {
  pesoBruto: number;
  percentualPerda: number;
  custoUnitario: number;
}

export function calcularPesoLiquidoItem(item: ItemCalculoInput): number {
  return item.pesoBruto * (1 - item.percentualPerda / 100);
}

/** Custo é sobre o peso BRUTO (o que foi comprado/pago) — a perda afeta rendimento, não o valor pago. */
export function calcularCustoTotalItem(item: ItemCalculoInput): number {
  return item.pesoBruto * item.custoUnitario;
}

export interface ResumoFichaTecnicaInput {
  itens: ItemCalculoInput[];
  rendimentoQuantidade: number;
  precoVendaPraticado: number | null;
  margemContribuicaoPercentualAlvo: number | null;
  margemContribuicaoPadraoEmpresa: number | null;
}

export interface ResumoFichaTecnica {
  pesoBrutoTotal: number;
  pesoLiquidoTotal: number;
  custoTotal: number;
  custoPorPorcao: number;
  margemAlvoEfetiva: number;
  /** Preço que entrega a margem-alvo sobre o custo direto de ingredientes. */
  precoSugerido: number | null;
  /** preco_venda_praticado quando informado, senão preco_sugerido — base das métricas %. */
  precoReferencia: number | null;
  /** = food cost %: mesma métrica, dois rótulos na UI. */
  cmvPercentual: number | null;
  margemContribuicaoPercentual: number | null;
  markupPercentual: number | null;
}

export function calcularResumoFichaTecnica({
  itens,
  rendimentoQuantidade,
  precoVendaPraticado,
  margemContribuicaoPercentualAlvo,
  margemContribuicaoPadraoEmpresa,
}: ResumoFichaTecnicaInput): ResumoFichaTecnica {
  const pesoBrutoTotal = itens.reduce((soma, item) => soma + item.pesoBruto, 0);
  const pesoLiquidoTotal = itens.reduce(
    (soma, item) => soma + calcularPesoLiquidoItem(item),
    0,
  );
  const custoTotal = itens.reduce(
    (soma, item) => soma + calcularCustoTotalItem(item),
    0,
  );
  const custoPorPorcao =
    rendimentoQuantidade > 0 ? custoTotal / rendimentoQuantidade : 0;

  const margemAlvoEfetiva =
    margemContribuicaoPercentualAlvo ??
    margemContribuicaoPadraoEmpresa ??
    MARGEM_CONTRIBUICAO_PADRAO_SISTEMA;

  const precoSugerido =
    margemAlvoEfetiva < 100
      ? custoPorPorcao / (1 - margemAlvoEfetiva / 100)
      : null;

  const precoReferencia = precoVendaPraticado ?? precoSugerido;

  const cmvPercentual =
    precoReferencia !== null && precoReferencia > 0
      ? (custoPorPorcao / precoReferencia) * 100
      : null;

  const margemContribuicaoPercentual =
    cmvPercentual === null ? null : 100 - cmvPercentual;

  const markupPercentual =
    custoPorPorcao > 0 && precoReferencia !== null && precoReferencia > 0
      ? (precoReferencia / custoPorPorcao - 1) * 100
      : null;

  return {
    pesoBrutoTotal,
    pesoLiquidoTotal,
    custoTotal,
    custoPorPorcao,
    margemAlvoEfetiva,
    precoSugerido,
    precoReferencia,
    cmvPercentual,
    margemContribuicaoPercentual,
    markupPercentual,
  };
}
