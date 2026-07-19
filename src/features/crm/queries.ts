import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function buscarVendasPorClienteUltimos60Dias(): Promise<Map<string, string[]>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return new Map();

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 60);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .select("cliente_id, data_venda")
    .eq("empresa_id", empresa.id)
    .not("cliente_id", "is", null)
    .gte("data_venda", dataLimite.toISOString().slice(0, 10));

  if (error) throw error;

  const mapa = new Map<string, string[]>();
  for (const linha of data ?? []) {
    if (!linha.cliente_id) continue;
    const datas = mapa.get(linha.cliente_id) ?? [];
    datas.push(linha.data_venda);
    mapa.set(linha.cliente_id, datas);
  }
  return mapa;
}

export interface ResumoFunilDashboard {
  totalLeadsAbertos: number;
  valorEstimadoAberto: number;
  totalConvertidos: number;
  totalPerdidos: number;
  taxaConversaoPercentual: number;
}

export async function buscarResumoFunil(): Promise<ResumoFunilDashboard> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { totalLeadsAbertos: 0, valorEstimadoAberto: 0, totalConvertidos: 0, totalPerdidos: 0, taxaConversaoPercentual: 0 };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .select("status, valor_estimado")
    .eq("empresa_id", empresa.id);

  if (error) throw error;

  const leads = data ?? [];
  const abertos = leads.filter((lead) => lead.status === "aberto");
  const convertidos = leads.filter((lead) => lead.status === "convertido");
  const perdidos = leads.filter((lead) => lead.status === "perdido");
  const totalFechados = convertidos.length + perdidos.length;

  return {
    totalLeadsAbertos: abertos.length,
    valorEstimadoAberto: abertos.reduce((total, lead) => total + lead.valor_estimado, 0),
    totalConvertidos: convertidos.length,
    totalPerdidos: perdidos.length,
    taxaConversaoPercentual: totalFechados > 0 ? (convertidos.length / totalFechados) * 100 : 0,
  };
}

export interface ResumoCuponsDashboard {
  totalUsos: number;
  totalDescontoConcedido: number;
}

export async function buscarResumoCupons(): Promise<ResumoCuponsDashboard> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { totalUsos: 0, totalDescontoConcedido: 0 };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cupons_usos")
    .select("valor_desconto")
    .eq("empresa_id", empresa.id);

  if (error) throw error;

  return {
    totalUsos: (data ?? []).length,
    totalDescontoConcedido: (data ?? []).reduce((total, linha) => total + linha.valor_desconto, 0),
  };
}

export interface ResumoFidelidadeCashbackDashboard {
  pontosEmitidos: number;
  pontosResgatados: number;
  cashbackEmitido: number;
  cashbackResgatado: number;
}

export async function buscarResumoFidelidadeCashback(): Promise<ResumoFidelidadeCashbackDashboard> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { pontosEmitidos: 0, pontosResgatados: 0, cashbackEmitido: 0, cashbackResgatado: 0 };

  const supabase = await createClient();
  const [{ data: pontos, error: errorPontos }, { data: cashback, error: errorCashback }] = await Promise.all([
    supabase.from("crm_fidelidade_movimentacoes").select("tipo, pontos").eq("empresa_id", empresa.id),
    supabase.from("crm_cashback_movimentacoes").select("tipo, valor").eq("empresa_id", empresa.id),
  ]);

  if (errorPontos) throw errorPontos;
  if (errorCashback) throw errorCashback;

  const pontosEmitidos = (pontos ?? [])
    .filter((linha) => linha.tipo === "ganho")
    .reduce((total, linha) => total + linha.pontos, 0);
  const pontosResgatados = Math.abs(
    (pontos ?? []).filter((linha) => linha.tipo === "resgate").reduce((total, linha) => total + linha.pontos, 0),
  );

  const cashbackEmitido = (cashback ?? [])
    .filter((linha) => linha.tipo === "credito")
    .reduce((total, linha) => total + linha.valor, 0);
  const cashbackResgatado = Math.abs(
    (cashback ?? []).filter((linha) => linha.tipo === "resgate").reduce((total, linha) => total + linha.valor, 0),
  );

  return { pontosEmitidos, pontosResgatados, cashbackEmitido, cashbackResgatado };
}

export async function contarContatosPorCampanha(): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("crm_interacoes")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .not("campanha_id", "is", null);

  if (error) throw error;
  return count ?? 0;
}
