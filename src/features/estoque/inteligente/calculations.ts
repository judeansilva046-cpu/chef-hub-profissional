/** Curva ABC, giro, consumo, previsão, CMV e alertas de estoque inteligente. */

export type ClasseAbc = "A" | "B" | "C";

export type AlertaNivel = "ok" | "baixo" | "critico" | "zerado";

export interface ItemConsumoInput {
  ingredienteId: string;
  nome: string;
  categoriaId?: string | null;
  categoriaNome?: string | null;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
  /** Quantidade consumida (saídas) no período analisado. */
  consumoPeriodo: number;
  /** Dias do período (ex.: 30). */
  diasPeriodo: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  custoMedio: number;
  /** Faturamento atribuído (vendas × custo ou receita). */
  faturamento?: number;
  /** Margem estimada (receita − custo). */
  margem?: number;
}

export interface ItemAbc {
  ingredienteId: string;
  nome: string;
  valor: number;
  percentual: number;
  percentualAcumulado: number;
  classe: ClasseAbc;
}

export interface GiroEstoque {
  ingredienteId: string;
  nome: string;
  consumoPeriodo: number;
  estoqueMedio: number;
  giroMensal: number;
  giroSemanal: number;
  diasCobertura: number | null;
  velocidadeDiaria: number;
}

export interface ConsumoMedio {
  ingredienteId: string;
  nome: string;
  categoriaId?: string | null;
  categoriaNome?: string | null;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
  diario: number;
  semanal: number;
  mensal: number;
}

export interface PrevisaoCompra {
  ingredienteId: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  consumoDiario: number;
  horizonteDias: number;
  quantidadeSugerida: number;
  comprarAte: string; // ISO date
  diasCobertura: number | null;
  fatorSazonalidade: number;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
  precoUnitario?: number | null;
  prioridade: "baixa" | "media" | "alta" | "critica";
  motivo: string;
}

export interface AlertaEstoque {
  ingredienteId: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  nivel: AlertaNivel;
}

export interface CmvInteligente {
  estoqueInicialValor: number;
  comprasValor: number;
  perdasValor: number;
  estoqueFinalValor: number;
  cmv: number;
  cmvPercentualSobreVendas: number | null;
}

/** Classifica itens em A/B/C (80/15/5) por valor (faturamento, consumo, margem ou giro). */
export function classificarCurvaAbc(
  itens: Array<{ ingredienteId: string; nome: string; valor: number }>,
): ItemAbc[] {
  const positivos = itens
    .map((i) => ({ ...i, valor: Math.max(0, i.valor) }))
    .sort((a, b) => b.valor - a.valor);

  const total = positivos.reduce((s, i) => s + i.valor, 0);
  if (total <= 0) {
    return positivos.map((i) => ({
      ...i,
      percentual: 0,
      percentualAcumulado: 0,
      classe: "C" as const,
    }));
  }

  let acumulado = 0;
  return positivos.map((item) => {
    const percentual = (item.valor / total) * 100;
    acumulado += percentual;
    const classe: ClasseAbc =
      acumulado <= 80 ? "A" : acumulado <= 95 ? "B" : "C";
    return {
      ingredienteId: item.ingredienteId,
      nome: item.nome,
      valor: item.valor,
      percentual: round2(percentual),
      percentualAcumulado: round2(acumulado),
      classe,
    };
  });
}

export function calcularGiro(item: {
  ingredienteId: string;
  nome: string;
  consumoPeriodo: number;
  diasPeriodo: number;
  estoqueAtual: number;
  /** Se omitido, usa estoque atual como proxy de estoque médio. */
  estoqueMedio?: number;
}): GiroEstoque {
  const dias = Math.max(1, item.diasPeriodo);
  const estoqueMedio = Math.max(0, item.estoqueMedio ?? item.estoqueAtual);
  const velocidadeDiaria = item.consumoPeriodo / dias;
  const giroMensal =
    estoqueMedio > 0 ? (velocidadeDiaria * 30) / estoqueMedio : item.consumoPeriodo > 0 ? Infinity : 0;
  const giroSemanal =
    estoqueMedio > 0 ? (velocidadeDiaria * 7) / estoqueMedio : item.consumoPeriodo > 0 ? Infinity : 0;
  const diasCobertura =
    velocidadeDiaria > 0 ? item.estoqueAtual / velocidadeDiaria : item.estoqueAtual > 0 ? null : 0;

  return {
    ingredienteId: item.ingredienteId,
    nome: item.nome,
    consumoPeriodo: item.consumoPeriodo,
    estoqueMedio,
    giroMensal: finiteOrZero(giroMensal),
    giroSemanal: finiteOrZero(giroSemanal),
    diasCobertura: diasCobertura == null ? null : round2(diasCobertura),
    velocidadeDiaria: round4(velocidadeDiaria),
  };
}

export function calcularConsumoMedio(item: ItemConsumoInput): ConsumoMedio {
  const dias = Math.max(1, item.diasPeriodo);
  const diario = item.consumoPeriodo / dias;
  return {
    ingredienteId: item.ingredienteId,
    nome: item.nome,
    categoriaId: item.categoriaId,
    categoriaNome: item.categoriaNome,
    fornecedorId: item.fornecedorId,
    fornecedorNome: item.fornecedorNome,
    diario: round4(diario),
    semanal: round4(diario * 7),
    mensal: round4(diario * 30),
  };
}

export function agregarConsumoPorDimensao(
  itens: ConsumoMedio[],
  dimensao: "produto" | "categoria" | "fornecedor",
): Array<{ chave: string; label: string; diario: number; semanal: number; mensal: number }> {
  const map = new Map<string, { label: string; diario: number; semanal: number; mensal: number }>();

  for (const item of itens) {
    let chave: string;
    let label: string;
    if (dimensao === "categoria") {
      chave = item.categoriaId ?? "sem-categoria";
      label = item.categoriaNome ?? "Sem categoria";
    } else if (dimensao === "fornecedor") {
      chave = item.fornecedorId ?? "sem-fornecedor";
      label = item.fornecedorNome ?? "Sem fornecedor";
    } else {
      chave = item.ingredienteId;
      label = item.nome;
    }
    const atual = map.get(chave) ?? { label, diario: 0, semanal: 0, mensal: 0 };
    atual.diario += item.diario;
    atual.semanal += item.semanal;
    atual.mensal += item.mensal;
    map.set(chave, atual);
  }

  return [...map.entries()]
    .map(([chave, v]) => ({
      chave,
      label: v.label,
      diario: round4(v.diario),
      semanal: round4(v.semanal),
      mensal: round4(v.mensal),
    }))
    .sort((a, b) => b.mensal - a.mensal);
}

/**
 * Previsão de compra:
 * necessidade = consumo_previsto × sazonalidade + mínimo − estoque − já_comprado_futuro
 */
export function preverCompra(input: {
  ingredienteId: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  consumoDiario: number;
  horizonteDias?: number;
  fatorSazonalidade?: number;
  pedidosFuturosQty?: number;
  hojeIso?: string;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
  precoUnitario?: number | null;
}): PrevisaoCompra {
  const horizonte = input.horizonteDias ?? 7;
  const sazonalidade = input.fatorSazonalidade ?? 1;
  const consumoPrevisto = input.consumoDiario * horizonte * sazonalidade;
  const necessidade = Math.max(
    0,
    consumoPrevisto + input.estoqueMinimo - input.estoqueAtual - (input.pedidosFuturosQty ?? 0),
  );
  const diasCobertura =
    input.consumoDiario > 0 ? input.estoqueAtual / input.consumoDiario : null;

  const hoje = input.hojeIso ? new Date(input.hojeIso) : new Date();
  const diasAteRepos =
    diasCobertura == null
      ? 0
      : Math.max(0, Math.floor(diasCobertura) - 1);
  const comprarAte = addDaysIso(hoje, Math.min(diasAteRepos, horizonte));

  const nivel = nivelAlerta(input.estoqueAtual, input.estoqueMinimo);
  let prioridade: PrevisaoCompra["prioridade"] = "baixa";
  let motivo = "Reposição preventiva pelo histórico de consumo.";

  if (nivel === "zerado") {
    prioridade = "critica";
    motivo = "Estoque zerado — comprar imediatamente.";
  } else if (nivel === "critico") {
    prioridade = "critica";
    motivo = "Estoque crítico (≤ 25% do mínimo).";
  } else if (nivel === "baixo") {
    prioridade = "alta";
    motivo = "Abaixo do estoque mínimo.";
  } else if (diasCobertura != null && diasCobertura < horizonte) {
    prioridade = "media";
    motivo = `Cobertura de ${round2(diasCobertura)} dias — abaixo do horizonte de ${horizonte} dias.`;
  }

  if (necessidade <= 0 && prioridade === "baixa") {
    motivo = "Estoque suficiente para o horizonte; sem compra necessária.";
  }

  return {
    ingredienteId: input.ingredienteId,
    nome: input.nome,
    estoqueAtual: input.estoqueAtual,
    estoqueMinimo: input.estoqueMinimo,
    consumoDiario: round4(input.consumoDiario),
    horizonteDias: horizonte,
    quantidadeSugerida: round4(necessidade),
    comprarAte,
    diasCobertura: diasCobertura == null ? null : round2(diasCobertura),
    fatorSazonalidade: sazonalidade,
    fornecedorId: input.fornecedorId,
    fornecedorNome: input.fornecedorNome,
    precoUnitario: input.precoUnitario,
    prioridade,
    motivo,
  };
}

export function nivelAlerta(estoqueAtual: number, estoqueMinimo: number): AlertaNivel {
  if (estoqueAtual <= 0) return "zerado";
  if (estoqueMinimo <= 0) return "ok";
  if (estoqueAtual < estoqueMinimo * 0.25) return "critico";
  if (estoqueAtual < estoqueMinimo) return "baixo";
  return "ok";
}

export function listarAlertas(itens: ItemConsumoInput[]): AlertaEstoque[] {
  return itens
    .map((i) => ({
      ingredienteId: i.ingredienteId,
      nome: i.nome,
      estoqueAtual: i.estoqueAtual,
      estoqueMinimo: i.estoqueMinimo,
      nivel: nivelAlerta(i.estoqueAtual, i.estoqueMinimo),
    }))
    .filter((a) => a.nivel !== "ok")
    .sort((a, b) => rankNivel(a.nivel) - rankNivel(b.nivel));
}

/**
 * CMV clássico: EI + Compras − EF (+ perdas já saíram do estoque final;
 * se perdas forem informadas à parte e ainda estiverem no EI, somam ao CMV).
 * Aqui: CMV = EI + compras + perdas_registradas − EF
 * (perdas já baixadas refletem em EF menor; somar perdas evita double-count
 * se EF já as descontou — usamos perdas só como breakdown; CMV = EI+compras−EF).
 */
export function calcularCmvInteligente(input: {
  estoqueInicialValor: number;
  comprasValor: number;
  perdasValor: number;
  estoqueFinalValor: number;
  vendasValor?: number;
}): CmvInteligente {
  const cmv = Math.max(
    0,
    input.estoqueInicialValor + input.comprasValor - input.estoqueFinalValor,
  );
  const cmvPercentualSobreVendas =
    input.vendasValor && input.vendasValor > 0
      ? round2((cmv / input.vendasValor) * 100)
      : null;

  return {
    estoqueInicialValor: round2(input.estoqueInicialValor),
    comprasValor: round2(input.comprasValor),
    perdasValor: round2(input.perdasValor),
    estoqueFinalValor: round2(input.estoqueFinalValor),
    cmv: round2(cmv),
    cmvPercentualSobreVendas,
  };
}

/** Fator sazonal simples: consumo últimos 7d / média diária dos 30d anteriores. */
export function fatorSazonalidade(consumo7d: number, consumo30dAnterior: number): number {
  const media30 = consumo30dAnterior / 30;
  if (media30 <= 0) return 1;
  const media7 = consumo7d / 7;
  const fator = media7 / media30;
  return Math.min(2.5, Math.max(0.4, round4(fator)));
}

export function valorParadoEmEstoque(
  itens: Array<{ estoqueAtual: number; custoMedio: number; consumoPeriodo: number; diasPeriodo: number }>,
): number {
  return round2(
    itens
      .filter((i) => {
        const vel = i.consumoPeriodo / Math.max(1, i.diasPeriodo);
        return i.estoqueAtual > 0 && vel <= 0;
      })
      .reduce((s, i) => s + i.estoqueAtual * i.custoMedio, 0),
  );
}

export function economiaGeradaSugestoes(
  sugestoes: Array<{ quantidadeSugerida: number; precoUnitario?: number | null }>,
  precosAlternativos: Array<{ precoUnitario?: number | null }>,
): number {
  let economia = 0;
  for (let i = 0; i < sugestoes.length; i++) {
    const melhor = sugestoes[i]!.precoUnitario;
    const alt = precosAlternativos[i]?.precoUnitario;
    if (melhor != null && alt != null && alt > melhor) {
      economia += (alt - melhor) * sugestoes[i]!.quantidadeSugerida;
    }
  }
  return round2(economia);
}

function rankNivel(n: AlertaNivel): number {
  return { zerado: 0, critico: 1, baixo: 2, ok: 3 }[n];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function finiteOrZero(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return round4(n);
}

function addDaysIso(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
