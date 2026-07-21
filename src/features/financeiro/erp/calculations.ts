export type CashFlowEntry = {
  flow_date: string;
  tipo: "entrada" | "saida" | string;
  amount: number;
};

export type DreInput = {
  receitaBruta: number;
  impostos: number;
  cmv: number;
  despesasOperacionais: number;
  folha: number;
  marketing: number;
  aluguel: number;
  depreciacao?: number;
  outrasDespesas?: number;
  outrasReceitas?: number;
};

export type DreResult = {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  cmv: number;
  lucroBruto: number;
  despesasOperacionais: number;
  folha: number;
  marketing: number;
  aluguel: number;
  ebitda: number;
  lucroOperacional: number;
  lucroLiquido: number;
  margemBrutaPct: number;
  margemOperacionalPct: number;
  margemLiquidaPct: number;
};

export function calcularDre(input: DreInput): DreResult {
  const receitaBruta = n(input.receitaBruta);
  const impostos = n(input.impostos);
  const cmv = n(input.cmv);
  const despesasOperacionais = n(input.despesasOperacionais);
  const folha = n(input.folha);
  const marketing = n(input.marketing);
  const aluguel = n(input.aluguel);
  const depreciacao = n(input.depreciacao);
  const outrasDespesas = n(input.outrasDespesas);
  const outrasReceitas = n(input.outrasReceitas);

  const receitaLiquida = receitaBruta - impostos + outrasReceitas;
  const lucroBruto = receitaLiquida - cmv;
  const opex = despesasOperacionais + folha + marketing + aluguel + outrasDespesas;
  const ebitda = lucroBruto - opex;
  const lucroOperacional = ebitda - depreciacao;
  const lucroLiquido = lucroOperacional;

  return {
    receitaBruta,
    impostos,
    receitaLiquida,
    cmv,
    lucroBruto,
    despesasOperacionais,
    folha,
    marketing,
    aluguel,
    ebitda,
    lucroOperacional,
    lucroLiquido,
    margemBrutaPct: pct(lucroBruto, receitaLiquida),
    margemOperacionalPct: pct(lucroOperacional, receitaLiquida),
    margemLiquidaPct: pct(lucroLiquido, receitaLiquida),
  };
}

export type SaldoPeriodo = {
  entradas: number;
  saidas: number;
  saldo: number;
};

export function agregarFluxoCaixa(entries: CashFlowEntry[]): SaldoPeriodo {
  let entradas = 0;
  let saidas = 0;
  for (const e of entries) {
    const v = n(e.amount);
    if (e.tipo === "entrada") entradas += v;
    else saidas += v;
  }
  return { entradas, saidas, saldo: entradas - saidas };
}

export function saldoDiario(
  entries: CashFlowEntry[],
  openingBalance = 0,
): Array<{ date: string; entradas: number; saidas: number; saldo: number }> {
  const byDate = new Map<string, CashFlowEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.flow_date) ?? [];
    list.push(e);
    byDate.set(e.flow_date, list);
  }
  const dates = [...byDate.keys()].sort();
  let running = openingBalance;
  return dates.map((date) => {
    const agg = agregarFluxoCaixa(byDate.get(date) ?? []);
    running += agg.saldo;
    return { date, entradas: agg.entradas, saidas: agg.saidas, saldo: running };
  });
}

export function projetarSaldo(
  saldoAtual: number,
  projectedIn: number,
  projectedOut: number,
): number {
  return n(saldoAtual) + n(projectedIn) - n(projectedOut);
}

export function statusTitulo(
  dueDate: string,
  amount: number,
  paidOrReceived: number,
  todayIso: string,
): "open" | "partial" | "paid" | "overdue" {
  if (paidOrReceived + 0.009 >= amount) return "paid";
  if (paidOrReceived > 0) {
    return dueDate < todayIso ? "overdue" : "partial";
  }
  return dueDate < todayIso ? "overdue" : "open";
}

export function calcularTotalComEncargos(
  amount: number,
  interest: number,
  fine: number,
): number {
  return n(amount) + n(interest) + n(fine);
}

export type FinanceAlert =
  | "conta_vencendo"
  | "conta_vencida"
  | "fluxo_negativo"
  | "cmv_alto"
  | "margem_baixa"
  | "caixa_negativo";

export function detectarAlertasFinanceiros(input: {
  apVencendo: number;
  apVencidas: number;
  saldoFluxo: number;
  cmvPct: number | null;
  margemPct: number | null;
  saldoCaixa: number;
}): Array<{ tipo: FinanceAlert; severidade: "warning" | "error" | "critical"; mensagem: string }> {
  const out: Array<{
    tipo: FinanceAlert;
    severidade: "warning" | "error" | "critical";
    mensagem: string;
  }> = [];

  if (input.apVencendo > 0) {
    out.push({
      tipo: "conta_vencendo",
      severidade: "warning",
      mensagem: `${input.apVencendo} conta(s) a pagar vencendo em 7 dias.`,
    });
  }
  if (input.apVencidas > 0) {
    out.push({
      tipo: "conta_vencida",
      severidade: "error",
      mensagem: `${input.apVencidas} conta(s) a pagar vencida(s).`,
    });
  }
  if (input.saldoFluxo < 0) {
    out.push({
      tipo: "fluxo_negativo",
      severidade: "error",
      mensagem: "Fluxo de caixa do período está negativo.",
    });
  }
  if (input.cmvPct != null && input.cmvPct > 40) {
    out.push({
      tipo: "cmv_alto",
      severidade: "warning",
      mensagem: `CMV elevado (${input.cmvPct.toFixed(1)}%).`,
    });
  }
  if (input.margemPct != null && input.margemPct < 20) {
    out.push({
      tipo: "margem_baixa",
      severidade: "warning",
      mensagem: `Margem baixa (${input.margemPct.toFixed(1)}%).`,
    });
  }
  if (input.saldoCaixa < 0) {
    out.push({
      tipo: "caixa_negativo",
      severidade: "critical",
      mensagem: "Saldo de caixa negativo.",
    });
  }
  return out;
}

function n(v: number | undefined | null): number {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}
