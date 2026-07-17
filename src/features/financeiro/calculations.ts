/**
 * Fórmulas do módulo Financeiro. Todas reaproveitam campos JÁ calculados da
 * ficha técnica (custo_por_porcao, preco_venda_praticado, preco_sugerido —
 * ver src/features/fichas-tecnicas/calculations.ts e docs/DATABASE.md) como
 * entrada — nada aqui recalcula CMV/food cost do zero. O que este módulo
 * adiciona é uma camada de "custeio completo": custos variáveis da venda
 * (taxa de cartão, comissão, embalagem) e custos fixos da empresa (aluguel,
 * salários), que a ficha técnica sozinha não considera.
 */

/** Primeiro dia do mês corrente, no formato usado por metas_vendas.mes_referencia. */
export function mesAtualReferencia(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export interface CustoVariavelAgregado {
  /** Soma dos custos variáveis do tipo percentual_sobre_venda (ex: 3,5% cartão + 12% marketplace = 15,5). */
  percentualTotal: number;
  /** Soma dos custos variáveis do tipo valor_fixo_por_venda (ex: R$ 2,00 de embalagem). */
  fixoTotal: number;
}

/**
 * Converte a taxa de um canal de venda (canais_venda) para o mesmo formato
 * de custos_variaveis — pronto para combinarCustosVariaveis +
 * calcularMargemContribuicaoReal/calcularPrecoParaMargemAlvo. Vive aqui (não
 * em queries.ts, que é server-only) porque é usada também por Client
 * Components (Simulador de Promoções, Precificação por canal).
 */
export function canalParaCustoVariavelAgregado(canal: {
  taxa_percentual: number;
  taxa_fixa: number;
}): CustoVariavelAgregado {
  return { percentualTotal: canal.taxa_percentual, fixoTotal: canal.taxa_fixa };
}

export interface MargemContribuicaoReal {
  /** Custo variável da venda (R$), já incluindo o percentual sobre o preço + o fixo por venda. */
  custoVariavelValor: number;
  /** preço − custo direto (ficha) − custo variável da venda. */
  margemUnitaria: number;
  /** margemUnitaria / preço × 100. */
  margemPercentual: number;
}

/**
 * Margem de contribuição "real": diferente de fichas_tecnicas.margem_contribuicao_percentual
 * (que só considera o custo direto de ingredientes), esta soma os custos
 * variáveis da venda (taxa de cartão, comissão, embalagem) antes de chegar
 * na margem. Retorna null quando não há preço de referência (ficha sem
 * preço sugerido nem praticado).
 */
export function calcularMargemContribuicaoReal(
  custoPorPorcao: number,
  precoReferencia: number | null,
  custosVariaveis: CustoVariavelAgregado,
): MargemContribuicaoReal | null {
  if (precoReferencia === null || precoReferencia <= 0) return null;

  const custoVariavelValor =
    precoReferencia * (custosVariaveis.percentualTotal / 100) +
    custosVariaveis.fixoTotal;
  const margemUnitaria = precoReferencia - custoPorPorcao - custoVariavelValor;
  const margemPercentual = (margemUnitaria / precoReferencia) * 100;

  return { custoVariavelValor, margemUnitaria, margemPercentual };
}

/**
 * Margem de contribuição % mínima que cada venda precisa entregar, em
 * média, para que a meta de faturamento do mês cubra os custos fixos. É o
 * "piso de saúde" usado no Painel e na Precificação — abaixo dele, mesmo
 * batendo a meta de faturamento, a empresa não cobre os custos fixos.
 */
export function calcularMargemNecessariaPercentual(
  custosFixosTotais: number,
  metaReceita: number | null,
): number | null {
  if (!metaReceita || metaReceita <= 0) return null;
  return (custosFixosTotais / metaReceita) * 100;
}

/** Faturamento mensal necessário para cobrir os custos fixos, dada a margem de contribuição média atual. */
export function calcularPontoEquilibrioReceita(
  custosFixosTotais: number,
  margemContribuicaoMediaPercentual: number | null,
): number | null {
  if (!margemContribuicaoMediaPercentual || margemContribuicaoMediaPercentual <= 0) {
    return null;
  }
  return custosFixosTotais / (margemContribuicaoMediaPercentual / 100);
}

/**
 * Unidades necessárias de UM produto para cobrir sozinho os custos fixos do
 * mês, se ele fosse o único item vendido — leitura por produto do ponto de
 * equilíbrio, útil para saber "quantos X preciso vender por mês".
 */
export function calcularPontoEquilibrioUnidades(
  custosFixosTotais: number,
  margemContribuicaoUnitaria: number | null,
): number | null {
  if (!margemContribuicaoUnitaria || margemContribuicaoUnitaria <= 0) return null;
  return custosFixosTotais / margemContribuicaoUnitaria;
}

/**
 * Combina dois agregados de custo variável (ex: custos variáveis gerais da
 * empresa + taxa de um canal específico) somando percentual com percentual e
 * fixo com fixo — os dois incidem juntos sobre a mesma venda. Não duplica
 * nenhuma fórmula: só soma os dois agregados para reusar
 * calcularMargemContribuicaoReal/calcularPrecoParaMargemAlvo sem que eles
 * precisem saber que "canal" existe.
 */
export function combinarCustosVariaveis(
  ...agregados: CustoVariavelAgregado[]
): CustoVariavelAgregado {
  return agregados.reduce(
    (total, agregado) => ({
      percentualTotal: total.percentualTotal + agregado.percentualTotal,
      fixoTotal: total.fixoTotal + agregado.fixoTotal,
    }),
    { percentualTotal: 0, fixoTotal: 0 },
  );
}

/**
 * Margem-alvo implícita numa ficha técnica: extraída do MESMO
 * `preco_sugerido` já calculado pelo banco (`custo_por_porcao / (1 −
 * margemAlvo / 100)`, ver docs/DATABASE.md) — sem reimplementar a cadeia de
 * prioridade (alvo da ficha > padrão da empresa > 70%), só invertendo a
 * fórmula existente. Retorna null quando não há preço sugerido ou custo (não
 * dá pra inferir a margem-alvo).
 */
export function margemAlvoImplicitaPercentual(
  custoPorPorcao: number,
  precoSugerido: number | null,
): number | null {
  if (!precoSugerido || precoSugerido <= 0 || custoPorPorcao <= 0) return null;
  return (1 - custoPorPorcao / precoSugerido) * 100;
}

/**
 * Preço necessário para entregar `margemAlvoPercentual` de margem de
 * contribuição REAL (após custo direto + custos variáveis agregados —
 * gerais e/ou de canal, já combinados via combinarCustosVariaveis) — a
 * versão "custeio completo" do `preco_sugerido` da ficha técnica (que só
 * considera custo direto de ingredientes). Retorna null quando a combinação
 * de margem-alvo + percentuais de custo variável ultrapassa 100% do preço
 * (nenhum preço finito cobre isso).
 */
export function calcularPrecoParaMargemAlvo(
  custoPorPorcao: number,
  margemAlvoPercentual: number,
  custosVariaveis: CustoVariavelAgregado,
): number | null {
  const fracaoRestante =
    1 - margemAlvoPercentual / 100 - custosVariaveis.percentualTotal / 100;
  if (fracaoRestante <= 0) return null;
  return (custoPorPorcao + custosVariaveis.fixoTotal) / fracaoRestante;
}

/**
 * Quantas unidades a mais (ou a menos) preciso vender no preço promocional
 * para manter o MESMO lucro total que eu tinha vendendo `quantidadeBase`
 * unidades no preço original — a pergunta central do Simulador de Promoções.
 * Retorna null quando a promoção zera ou inverte a margem (não há
 * quantidade que compense — a promoção dá prejuízo por unidade).
 */
export function calcularQuantidadeEquivalentePromocao(
  quantidadeBase: number,
  margemUnitariaOriginal: number,
  margemUnitariaPromocional: number,
): number | null {
  if (margemUnitariaPromocional <= 0) return null;
  return (quantidadeBase * margemUnitariaOriginal) / margemUnitariaPromocional;
}
