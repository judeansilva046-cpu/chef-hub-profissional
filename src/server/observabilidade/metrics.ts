import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

export type ObservabilityMetrics = {
  erros: number;
  errosPorModulo: Record<string, number>;
  alertasAbertos: number;
  usuariosAtivos: number;
  sessoesAbertas: number;
  tempoMedioRespostaMs: number | null;
  consultasLentas: number;
  rpcsLentas: number;
  rotasLentas: number;
  usoMemoriaMb: number | null;
  usoBancoAprox: string;
  ticketMedio: number;
  cmv: number;
  receita: number;
  lucroEstimado: number;
  margemPct: number;
  tempoMedioPedidoMin: number | null;
  tempoCozinhaMin: number | null;
  tempoAtendimentoMin: number | null;
};

function inicioFimDiaIso(): { inicio: string; fim: string } {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = String(hoje.getMonth() + 1).padStart(2, "0");
  const d = String(hoje.getDate()).padStart(2, "0");
  return {
    inicio: `${y}-${m}-${d}T00:00:00.000Z`,
    fim: `${y}-${m}-${d}T23:59:59.999Z`,
  };
}

async function requireGestao() {
  const papel = await getPapelNaEmpresaAtual();
  if (papel !== "owner" && papel !== "gerente") {
    throw new Error("Acesso restrito a Owner e Gerente.");
  }
  return papel;
}

export async function getObservabilityMetrics(): Promise<ObservabilityMetrics> {
  await requireGestao();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { inicio, fim } = inicioFimDiaIso();
  const mesInicio = primeiroDiaDoMesAtual();
  const mesFim = ultimoDiaDoMesAtual();

  const [
    logsRes,
    alertsRes,
    membrosRes,
    perfRes,
    pedidosDiaRes,
    vendasMesRes,
  ] = await Promise.all([
    supabase
      .from("system_logs")
      .select("nivel, modulo")
      .eq("empresa_id", empresa.id)
      .in("nivel", ["ERROR", "CRITICAL"])
      .gte("criado_em", inicio)
      .lte("criado_em", fim)
      .limit(500),
    supabase
      .from("system_alerts")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("resolvido", false),
    supabase
      .from("membros_empresa")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("ativo", true),
    supabase
      .from("performance_samples")
      .select("tipo, duracao_ms")
      .eq("empresa_id", empresa.id)
      .gte("criado_em", inicio)
      .lte("criado_em", fim)
      .limit(500),
    supabase
      .from("pedidos")
      .select("criado_em, confirmado_em, entregue_em, status, total")
      .eq("empresa_id", empresa.id)
      .gte("criado_em", inicio)
      .lte("criado_em", fim),
    supabase
      .from("vendas")
      .select("valor_total, margem_total")
      .eq("empresa_id", empresa.id)
      .gte("data_venda", mesInicio)
      .lte("data_venda", mesFim),
  ]);

  const errosPorModulo: Record<string, number> = {};
  for (const row of logsRes.data ?? []) {
    const mod = row.modulo ?? "geral";
    errosPorModulo[mod] = (errosPorModulo[mod] ?? 0) + 1;
  }

  const samples = perfRes.data ?? [];
  const avg =
    samples.length > 0
      ? Math.round(
          samples.reduce((a, s) => a + Number(s.duracao_ms), 0) / samples.length,
        )
      : null;

  const pedidos = pedidosDiaRes.data ?? [];
  const entregues = pedidos.filter((p) => p.entregue_em && p.criado_em);
  let tempoMedioPedidoMin: number | null = null;
  let tempoAtendimentoMin: number | null = null;
  let tempoCozinhaMin: number | null = null;

  if (entregues.length > 0) {
    const mins = entregues.map((p) => {
      const a = new Date(p.criado_em).getTime();
      const b = new Date(p.entregue_em!).getTime();
      return (b - a) / 60000;
    });
    tempoMedioPedidoMin =
      Math.round((mins.reduce((x, y) => x + y, 0) / mins.length) * 10) / 10;
    tempoAtendimentoMin = tempoMedioPedidoMin;
  }

  const comPreparo = pedidos.filter((p) => p.confirmado_em && p.entregue_em);
  if (comPreparo.length > 0) {
    const mins = comPreparo.map((p) => {
      const a = new Date(p.confirmado_em!).getTime();
      const b = new Date(p.entregue_em!).getTime();
      return (b - a) / 60000;
    });
    tempoCozinhaMin =
      Math.round((mins.reduce((x, y) => x + y, 0) / mins.length) * 10) / 10;
  }

  const vendas = vendasMesRes.data ?? [];
  const receita = vendas.reduce((a, v) => a + Number(v.valor_total ?? 0), 0);
  const margemTotal = vendas.reduce(
    (a, v) => a + Number(v.margem_total ?? 0),
    0,
  );
  const cmv = Math.max(0, receita - margemTotal);
  const lucroEstimado = margemTotal;
  const margemPct =
    receita > 0 ? Math.round((lucroEstimado / receita) * 1000) / 10 : 0;
  const ticketMedio =
    entregues.length > 0
      ? entregues.reduce((a, p) => a + Number(p.total), 0) / entregues.length
      : 0;

  const mem =
    typeof process !== "undefined" && typeof process.memoryUsage === "function"
      ? Math.round(process.memoryUsage().rss / (1024 * 1024))
      : null;

  return {
    erros: (logsRes.data ?? []).length,
    errosPorModulo,
    alertasAbertos: alertsRes.count ?? 0,
    usuariosAtivos: membrosRes.count ?? 0,
    sessoesAbertas: membrosRes.count ?? 0,
    tempoMedioRespostaMs: avg,
    consultasLentas: samples.filter((s) => s.tipo === "sql").length,
    rpcsLentas: samples.filter((s) => s.tipo === "rpc").length,
    rotasLentas: samples.filter((s) => s.tipo === "rota").length,
    usoMemoriaMb: mem,
    usoBancoAprox: "via Supabase (métricas detalhadas no painel do projeto)",
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    cmv: Math.round(cmv * 100) / 100,
    receita: Math.round(receita * 100) / 100,
    lucroEstimado: Math.round(lucroEstimado * 100) / 100,
    margemPct,
    tempoMedioPedidoMin,
    tempoCozinhaMin,
    tempoAtendimentoMin,
  };
}
