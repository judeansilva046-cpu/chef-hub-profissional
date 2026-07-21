import "server-only";

import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";
import { PAPEIS_FINANCEIRO } from "@/server/auth/papeis-acoes";
import {
  analisarVendas,
} from "@/features/dashboard/calculations";
import {
  calcularCustosFixosTotais,
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
} from "@/features/financeiro/queries";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";

import {
  agregarFluxoCaixa,
  calcularDre,
  detectarAlertasFinanceiros,
  projetarSaldo,
  saldoDiario,
} from "./calculations";

async function requireFinanceiro() {
  await requirePapel(...PAPEIS_FINANCEIRO);
  return requireEmpresaAtual();
}

export async function garantirDefaultsFinanceiros() {
  const empresa = await requireFinanceiro();
  const supabase = await createClient();
  await supabase.rpc("fn_seed_financeiro_defaults", {
    p_empresa_id: empresa.id,
  });
  return empresa;
}

export async function listarCentrosCusto() {
  const empresa = await garantirDefaultsFinanceiros();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cost_centers")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("active", true)
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function listarCategoriasFinanceiras() {
  const empresa = await garantirDefaultsFinanceiros();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_categories")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("active", true)
    .order("tipo")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listarContasBancarias() {
  const empresa = await garantirDefaultsFinanceiros();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listarContasPagar(opts?: {
  status?: string;
  limit?: number;
}) {
  const empresa = await requireFinanceiro();
  const supabase = await createClient();
  let q = supabase
    .from("accounts_payable")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("due_date", { ascending: true })
    .limit(opts?.limit ?? 100);
  if (opts?.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listarContasReceber(opts?: {
  status?: string;
  limit?: number;
}) {
  const empresa = await requireFinanceiro();
  const supabase = await createClient();
  let q = supabase
    .from("accounts_receivable")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("due_date", { ascending: true })
    .limit(opts?.limit ?? 100);
  if (opts?.status) q = q.eq("status", opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listarFluxoCaixa(opts: {
  dataInicio: string;
  dataFim: string;
}) {
  const empresa = await requireFinanceiro();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_flow")
    .select("*")
    .eq("empresa_id", empresa.id)
    .gte("flow_date", opts.dataInicio)
    .lte("flow_date", opts.dataFim)
    .order("flow_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listarTransacoesBancarias(opts?: {
  reconciled?: boolean;
  limit?: number;
}) {
  const empresa = await requireFinanceiro();
  const supabase = await createClient();
  let q = supabase
    .from("bank_transactions")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("tx_date", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.reconciled != null) q = q.eq("reconciled", opts.reconciled);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function carregarDashboardErp(opts?: {
  dataInicio?: string;
  dataFim?: string;
}) {
  const empresa = await garantirDefaultsFinanceiros();
  const dataInicio = opts?.dataInicio || primeiroDiaDoMesAtual();
  const dataFim = opts?.dataFim || ultimoDiaDoMesAtual();
  const hoje = hojeIso();
  const em7 = addDaysIso(hoje, 7);

  const supabase = await createClient();

  const [
    vendas,
    canais,
    custosVariaveis,
    custosFixos,
    fluxo,
    ap,
    ar,
    bancos,
  ] = await Promise.all([
    buscarVendasPorPeriodo({ dataInicio, dataFim }),
    listarCanaisVenda(),
    calcularCustosVariaveisAgregados(),
    calcularCustosFixosTotais(),
    listarFluxoCaixa({ dataInicio, dataFim }),
    listarContasPagar({ limit: 500 }),
    listarContasReceber({ limit: 500 }),
    listarContasBancarias(),
  ]);

  const canaisPorId = new Map(canais.map((c) => [c.id, c]));
  const analise = analisarVendas(vendas, custosVariaveis, canaisPorId);

  const receitaBruta = analise.resumo.faturamentoRealizado;
  const cmv = analise.resumo.cmvRealizado;
  const impostos = receitaBruta * 0.0; // placeholder — sem engine fiscal
  const folha = 0; // agregado via funcionários opcional
  const marketing = 0;
  const aluguel = custosFixos * 0.35;
  const despesasOperacionais = Math.max(0, custosFixos - aluguel);

  const dre = calcularDre({
    receitaBruta,
    impostos,
    cmv,
    despesasOperacionais,
    folha,
    marketing,
    aluguel,
  });

  const fluxoAgg = agregarFluxoCaixa(fluxo);
  const diario = saldoDiario(
    fluxo.map((f) => ({
      flow_date: f.flow_date,
      tipo: f.tipo,
      amount: Number(f.amount),
    })),
    bancos.reduce((a, b) => a + Number(b.opening_balance), 0),
  );

  const apOpen = ap.filter((a) => a.status !== "paid" && a.status !== "cancelled");
  const arOpen = ar.filter((a) => a.status !== "paid" && a.status !== "cancelled");
  const apVencidas = apOpen.filter((a) => a.due_date < hoje).length;
  const apVencendo = apOpen.filter(
    (a) => a.due_date >= hoje && a.due_date <= em7,
  ).length;

  const aPagarTotal = apOpen.reduce(
    (s, a) => s + Number(a.amount) - Number(a.paid_amount),
    0,
  );
  const aReceberTotal = arOpen.reduce(
    (s, a) => s + Number(a.amount) - Number(a.received_amount),
    0,
  );

  const saldoCaixa =
    bancos.reduce((a, b) => a + Number(b.opening_balance), 0) + fluxoAgg.saldo;

  const projectedIn = aReceberTotal;
  const projectedOut = aPagarTotal;
  const saldoProjetado = projetarSaldo(saldoCaixa, projectedIn, projectedOut);

  const ticketMedio =
    analise.resumo.quantidadeTotal > 0
      ? receitaBruta / analise.resumo.quantidadeTotal
      : 0;

  const alertas = detectarAlertasFinanceiros({
    apVencendo,
    apVencidas,
    saldoFluxo: fluxoAgg.saldo,
    cmvPct: analise.resumo.cmvPercentual,
    margemPct: analise.resumo.margemPercentual,
    saldoCaixa,
  });

  // Persist forecast snapshot (best-effort)
  void supabase.from("financial_forecasts").insert({
    empresa_id: empresa.id,
    period_start: dataInicio,
    period_end: dataFim,
    projected_in: projectedIn,
    projected_out: projectedOut,
    projected_balance: saldoProjetado,
    metadata: { source: "dashboard_erp" } as never,
  });

  return {
    periodo: { dataInicio, dataFim, hoje },
    dre,
    fluxo: {
      ...fluxoAgg,
      diario,
      semanal: fluxoAgg,
      mensal: fluxoAgg,
      projetado: saldoProjetado,
    },
    kpis: {
      faturamento: receitaBruta,
      cmv,
      cmvPct: analise.resumo.cmvPercentual,
      margemPct: analise.resumo.margemPercentual,
      lucro: dre.lucroLiquido,
      ebitda: dre.ebitda,
      ticketMedio,
      saldoCaixa,
      aPagarTotal,
      aReceberTotal,
      apVencidas,
      apVencendo,
    },
    alertas,
    contasPagar: ap.slice(0, 15),
    contasReceber: ar.slice(0, 15),
  };
}
