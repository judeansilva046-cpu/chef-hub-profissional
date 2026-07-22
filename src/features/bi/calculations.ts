import type {
  BiComparativoItem,
  BiDrillLevel,
  BiDrillNode,
  BiKpi,
  BiMetaProgresso,
  BiMetaTipo,
} from "./types";
import { deltaPercentual } from "./periods";

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function ticketMedio(receita: number, pedidos: number): number | null {
  if (pedidos <= 0) return null;
  return round2(receita / pedidos);
}

export function margemPercentual(lucro: number, receita: number): number | null {
  if (receita <= 0) return null;
  return round2((lucro / receita) * 100);
}

export function cmvPercentual(cmv: number, receita: number): number | null {
  if (receita <= 0) return null;
  return round2((cmv / receita) * 100);
}

/**
 * EBITDA simplificado (quando aplicável): lucro operacional + depreciação.
 * Sem depreciação cadastrada → igual ao lucro (transparência no hint).
 */
export function ebitdaSimplificado(
  lucro: number,
  depreciacao = 0,
): { valor: number; aplicavel: boolean } {
  if (depreciacao > 0) {
    return { valor: round2(lucro + depreciacao), aplicavel: true };
  }
  return { valor: round2(lucro), aplicavel: false };
}

/** LTV aproximado = ticket médio × frequência × horizonte (meses). */
export function calcularLtv(input: {
  ticketMedio: number;
  frequenciaMensal: number;
  horizonteMeses?: number;
}): number {
  const h = input.horizonteMeses ?? 12;
  if (input.ticketMedio <= 0 || input.frequenciaMensal <= 0) return 0;
  return round2(input.ticketMedio * input.frequenciaMensal * h);
}

export function taxaRetencao(
  clientesRecorrentes: number,
  clientesComCompra: number,
): number | null {
  if (clientesComCompra <= 0) return null;
  return round2((clientesRecorrentes / clientesComCompra) * 100);
}

export function progressoMeta(input: {
  valorMeta: number;
  valorAtual: number;
  invertida?: boolean;
}): number {
  if (input.valorMeta <= 0) return 0;
  if (input.invertida) {
    // CMV/desperdício: 100% quando atual <= meta; 0% quando atual >= 2× meta
    if (input.valorAtual <= input.valorMeta) return 100;
    const excesso = input.valorAtual - input.valorMeta;
    const pct = 100 - (excesso / input.valorMeta) * 100;
    return Math.max(0, round2(pct));
  }
  return round2(Math.min(999, (input.valorAtual / input.valorMeta) * 100));
}

export function metaInvertida(tipo: BiMetaTipo): boolean {
  return tipo === "cmv" || tipo === "desperdicio";
}

export function montarProgressoMetas(
  metas: Array<{
    id: string;
    tipo: BiMetaTipo;
    valor_meta: number;
    periodo_inicio: string;
    periodo_fim: string;
    unidade: string;
    observacao: string | null;
  }>,
  realizados: Partial<Record<BiMetaTipo, number>>,
): BiMetaProgresso[] {
  return metas.map((m) => {
    const invertida = metaInvertida(m.tipo);
    const valorAtual = realizados[m.tipo] ?? 0;
    return {
      id: m.id,
      tipo: m.tipo,
      valorMeta: Number(m.valor_meta),
      valorAtual,
      progressoPct: progressoMeta({
        valorMeta: Number(m.valor_meta),
        valorAtual,
        invertida,
      }),
      periodoInicio: m.periodo_inicio,
      periodoFim: m.periodo_fim,
      unidade: m.unidade,
      observacao: m.observacao,
      invertida,
    };
  });
}

export function montarComparativo(
  itens: Array<{
    label: string;
    atual: number;
    anterior: number;
    format: BiKpi["format"];
  }>,
): BiComparativoItem[] {
  return itens.map((i) => ({
    ...i,
    deltaPct: deltaPercentual(i.atual, i.anterior),
  }));
}

export type VendaDrillInput = {
  id?: string;
  ficha_tecnica_id: string;
  produtoNome?: string;
  categoriaId?: string | null;
  categoriaNome?: string | null;
  canal_venda_id: string | null;
  canalNome?: string | null;
  pedido_id?: string | null;
  pedidoNumero?: number | null;
  valor_total: number;
  margem_total?: number;
  quantidade: number;
};

/**
 * Agrega vendas no nível de drill-down solicitado.
 * Unidade = canal de venda (sem tabela de filiais no schema atual).
 */
export function agregarDrillDown(
  vendas: VendaDrillInput[],
  level: BiDrillLevel,
  filtros: {
    unidadeId?: string | null;
    categoriaId?: string | null;
    produtoId?: string | null;
  } = {},
): BiDrillNode[] {
  let filtered = vendas;
  if (filtros.unidadeId) {
    filtered = filtered.filter((v) => (v.canal_venda_id ?? "sem_canal") === filtros.unidadeId);
  }
  if (filtros.categoriaId) {
    filtered = filtered.filter((v) => (v.categoriaId ?? "sem_cat") === filtros.categoriaId);
  }
  if (filtros.produtoId) {
    filtered = filtered.filter((v) => v.ficha_tecnica_id === filtros.produtoId);
  }

  if (level === "empresa") {
    const receita = filtered.reduce((s, v) => s + v.valor_total, 0);
    const margem = filtered.reduce((s, v) => s + (v.margem_total ?? 0), 0);
    return [
      {
        id: "empresa",
        label: "Empresa",
        level: "empresa",
        receita: round2(receita),
        pedidos: filtered.length,
        margem: round2(margem),
      },
    ];
  }

  const map = new Map<string, BiDrillNode>();

  for (const v of filtered) {
    let id: string;
    let label: string;
    let nodeLevel: BiDrillLevel = level;

    if (level === "unidade") {
      id = v.canal_venda_id ?? "sem_canal";
      label = v.canalNome ?? "Sem canal";
    } else if (level === "categoria") {
      id = v.categoriaId ?? "sem_cat";
      label = v.categoriaNome ?? "Sem categoria";
    } else if (level === "produto") {
      id = v.ficha_tecnica_id;
      label = v.produtoNome ?? v.ficha_tecnica_id.slice(0, 8);
    } else {
      // pedido
      id = v.pedido_id ?? v.id ?? `${v.ficha_tecnica_id}-${v.valor_total}`;
      label = v.pedidoNumero != null ? `Pedido #${v.pedidoNumero}` : `Venda ${id.slice(0, 8)}`;
      nodeLevel = "pedido";
    }

    const atual = map.get(id) ?? {
      id,
      label,
      level: nodeLevel,
      receita: 0,
      pedidos: 0,
      margem: 0,
    };
    atual.receita = round2(atual.receita + v.valor_total);
    atual.pedidos += 1;
    atual.margem = round2((atual.margem ?? 0) + (v.margem_total ?? 0));
    map.set(id, atual);
  }

  return [...map.values()].sort((a, b) => b.receita - a.receita);
}

export function kpisFinanceiros(input: {
  receita: number;
  cmv: number;
  lucro: number;
  fluxoCaixa: number;
  depreciacao?: number;
  receitaAnterior?: number;
}): BiKpi[] {
  const ebitda = ebitdaSimplificado(input.lucro, input.depreciacao ?? 0);
  const margem = margemPercentual(input.lucro, input.receita);
  return [
    {
      id: "receita",
      label: "Receita",
      value: input.receita,
      format: "currency",
      deltaPct:
        input.receitaAnterior != null
          ? deltaPercentual(input.receita, input.receitaAnterior)
          : null,
    },
    {
      id: "lucro",
      label: "Lucro",
      value: input.lucro,
      format: "currency",
    },
    {
      id: "margem",
      label: "Margem",
      value: margem,
      format: "percent",
    },
    {
      id: "ebitda",
      label: "EBITDA",
      value: ebitda.valor,
      format: "currency",
      hint: ebitda.aplicavel
        ? "Lucro + depreciação"
        : "Igual ao lucro (sem depreciação cadastrada)",
    },
    {
      id: "fluxo",
      label: "Fluxo de caixa",
      value: input.fluxoCaixa,
      format: "currency",
    },
    {
      id: "cmv",
      label: "CMV %",
      value: cmvPercentual(input.cmv, input.receita),
      format: "percent",
    },
  ];
}

export function kpisOperacao(input: {
  tempoPreparoMin: number | null;
  tempoEntregaMin: number | null;
  tempoAtendimentoMin: number | null;
  pedidosPorHora: number | null;
}): BiKpi[] {
  return [
    {
      id: "prep",
      label: "Tempo médio de preparo",
      value: input.tempoPreparoMin,
      format: "minutes",
    },
    {
      id: "entrega",
      label: "Tempo de entrega",
      value: input.tempoEntregaMin,
      format: "minutes",
    },
    {
      id: "atend",
      label: "Tempo de atendimento",
      value: input.tempoAtendimentoMin,
      format: "minutes",
    },
    {
      id: "pph",
      label: "Pedidos por hora",
      value: input.pedidosPorHora,
      format: "number",
    },
  ];
}

export function kpisEstoque(input: {
  cmv: number;
  giro: number | null;
  coberturaDias: number | null;
  perdas: number;
}): BiKpi[] {
  return [
    { id: "cmv", label: "CMV", value: input.cmv, format: "currency" },
    { id: "giro", label: "Giro", value: input.giro, format: "number" },
    {
      id: "cobertura",
      label: "Cobertura (dias)",
      value: input.coberturaDias,
      format: "number",
    },
    { id: "perdas", label: "Perdas", value: input.perdas, format: "currency" },
  ];
}

export function kpisCrm(input: {
  ticketMedio: number | null;
  frequencia: number | null;
  retencao: number | null;
  ltv: number;
  clientesAtivos: number;
}): BiKpi[] {
  return [
    {
      id: "ticket",
      label: "Ticket médio",
      value: input.ticketMedio,
      format: "currency",
    },
    {
      id: "freq",
      label: "Frequência",
      value: input.frequencia,
      format: "number",
      hint: "Compras / cliente (período)",
    },
    {
      id: "retencao",
      label: "Retenção",
      value: input.retencao,
      format: "percent",
    },
    { id: "ltv", label: "Lifetime Value (LTV)", value: input.ltv, format: "currency" },
    {
      id: "ativos",
      label: "Clientes ativos",
      value: input.clientesAtivos,
      format: "number",
    },
  ];
}

export function kpisDelivery(input: {
  cancelamentos: number;
  taxaCancelamento: number | null;
  tempoMedioMin: number | null;
  avaliacaoMedia: number | null;
  receita: number;
}): BiKpi[] {
  return [
    {
      id: "cancel",
      label: "Cancelamentos",
      value: input.cancelamentos,
      format: "number",
    },
    {
      id: "taxa_cancel",
      label: "Taxa de cancelamento",
      value: input.taxaCancelamento,
      format: "percent",
    },
    {
      id: "tempo",
      label: "Tempo médio",
      value: input.tempoMedioMin,
      format: "minutes",
    },
    {
      id: "avaliacao",
      label: "Avaliações",
      value: input.avaliacaoMedia,
      format: "number",
      hint: input.avaliacaoMedia == null ? "Sem avaliações no período" : undefined,
    },
    {
      id: "receita",
      label: "Receita delivery",
      value: input.receita,
      format: "currency",
    },
  ];
}

export function pedidosPorHora(
  totalPedidos: number,
  horasJanela: number,
): number | null {
  if (horasJanela <= 0) return null;
  return round2(totalPedidos / horasJanela);
}

export function formatBiValue(
  value: number | null | undefined,
  format: BiKpi["format"],
): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (format === "currency") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (format === "percent") {
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }
  if (format === "minutes") {
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} min`;
  }
  if (format === "duration") {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
