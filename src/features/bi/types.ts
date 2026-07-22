export type BiDashboardId =
  | "visao_geral"
  | "financeiro"
  | "vendas"
  | "delivery"
  | "salao"
  | "estoque"
  | "crm"
  | "kds"
  | "funcionarios"
  | "metas";

export type BiMetaTipo =
  | "faturamento"
  | "lucro"
  | "cmv"
  | "ticket_medio"
  | "vendas"
  | "desperdicio";

export type BiComparativoModo =
  | "hoje_ontem"
  | "semana_semana"
  | "mes_mes"
  | "ano_ano";

/** Drill-down: empresa → unidade (canal) → categoria → produto → pedido */
export type BiDrillLevel =
  | "empresa"
  | "unidade"
  | "categoria"
  | "produto"
  | "pedido";

export type BiKpi = {
  id: string;
  label: string;
  value: number | null;
  format: "currency" | "percent" | "number" | "minutes" | "duration";
  hint?: string;
  deltaPct?: number | null;
};

export type BiComparativoItem = {
  label: string;
  atual: number;
  anterior: number;
  deltaPct: number | null;
  format: BiKpi["format"];
};

export type BiDrillNode = {
  id: string;
  label: string;
  level: BiDrillLevel;
  receita: number;
  pedidos: number;
  margem?: number;
};

export type BiMetaProgresso = {
  id: string;
  tipo: BiMetaTipo;
  valorMeta: number;
  valorAtual: number;
  progressoPct: number;
  periodoInicio: string;
  periodoFim: string;
  unidade: string;
  observacao: string | null;
  /** Metas de CMV/desperdício: menor é melhor. */
  invertida: boolean;
};
