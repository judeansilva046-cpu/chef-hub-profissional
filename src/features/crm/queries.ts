import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import {
  calcularDashboardCrm,
  segmentarClientes,
  type ClienteMetricas,
  type SegmentKey,
} from "./calculations";

export type LoyaltyProgram = Tables<"loyalty_programs">;
export type Coupon = Tables<"coupons">;
export type MarketingCampaign = Tables<"marketing_campaigns">;
export type CustomerProfile = Tables<"customers_profiles">;

export async function garantirCrmDefaults(): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_seed_crm_defaults", {
    p_empresa_id: empresa.id,
  });
  void error; // Migration 0051 ainda não aplicada → ignora.
}

export async function obterProgramaFidelidade(): Promise<LoyaltyProgram | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;
  await garantirCrmDefaults();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("empresa_id", empresa.id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function saldoPontosCliente(clienteId: string): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;
  const supabase = await createClient();
  const { data } = await supabase
    .from("loyalty_points")
    .select("balance_after")
    .eq("empresa_id", empresa.id)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.balance_after ?? 0);
}

export async function saldoCashbackCliente(clienteId: string): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cashback_transactions")
    .select("balance_after")
    .eq("empresa_id", empresa.id)
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Number(data?.balance_after ?? 0);
}

export async function buscarPerfilCliente(
  clienteId: string,
): Promise<CustomerProfile | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers_profiles")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("cliente_id", clienteId)
    .maybeSingle();
  return data;
}

export async function listarCupons(): Promise<Coupon[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data ?? [];
}

export async function listarCampanhas(): Promise<MarketingCampaign[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return data ?? [];
}

async function metricasClientes(): Promise<ClienteMetricas[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, ativo, criado_em")
    .eq("empresa_id", empresa.id);

  const { data: vendas } = await supabase
    .from("vendas")
    .select("cliente_id, quantidade, preco_unitario_praticado, data_venda")
    .eq("empresa_id", empresa.id)
    .not("cliente_id", "is", null);

  const agora = Date.now();
  const porCliente = new Map<
    string,
    { total: number; compras: number; ultima: string | null }
  >();

  for (const v of vendas ?? []) {
    if (!v.cliente_id) continue;
    const valor = Number(v.quantidade) * Number(v.preco_unitario_praticado);
    const atual = porCliente.get(v.cliente_id) ?? {
      total: 0,
      compras: 0,
      ultima: null,
    };
    atual.total += valor;
    atual.compras += 1;
    if (!atual.ultima || v.data_venda > atual.ultima) atual.ultima = v.data_venda;
    porCliente.set(v.cliente_id, atual);
  }

  return (clientes ?? []).map((c) => {
    const m = porCliente.get(c.id) ?? { total: 0, compras: 0, ultima: null };
    const diasCadastro = Math.floor(
      (agora - new Date(c.criado_em).getTime()) / 86_400_000,
    );
    const diasUltima = m.ultima
      ? Math.floor((agora - new Date(m.ultima).getTime()) / 86_400_000)
      : null;
    return {
      clienteId: c.id,
      nome: c.nome,
      totalGasto: m.total,
      quantidadeCompras: m.compras,
      ticketMedio: m.compras > 0 ? m.total / m.compras : 0,
      diasDesdeUltimaCompra: diasUltima,
      diasDesdeCadastro: diasCadastro,
      ativo: c.ativo,
    };
  });
}

export async function avaliarSegmentos(): Promise<Record<SegmentKey, string[]>> {
  const metricas = await metricasClientes();
  return segmentarClientes(metricas);
}

export async function listarSegmentosComContagem(): Promise<
  Array<Tables<"customer_segments"> & { ids: string[] }>
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  await garantirCrmDefaults();
  const segs = await avaliarSegmentos();
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_segments")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("name");

  const hoje = new Date().toISOString();
  const result = [];
  for (const row of data ?? []) {
    const ids = segs[row.key as SegmentKey] ?? [];
    await supabase
      .from("customer_segments")
      .update({ member_count: ids.length, last_evaluated_at: hoje })
      .eq("id", row.id);
    result.push({ ...row, member_count: ids.length, ids });
  }
  return result;
}

export async function carregarDashboardCrm() {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return calcularDashboardCrm({
      totalClientes: 0,
      novosClientes: 0,
      ativos: 0,
      inativos: 0,
      ticketMedio: 0,
      frequenciaMedia: 0,
      taxaRetorno: 0,
      cuponsUsados: 0,
      pontosEmitidos: 0,
      pontosResgatados: 0,
      cashbackConcedido: 0,
    });
  }

  await garantirCrmDefaults();
  const metricas = await metricasClientes();
  const segs = segmentarClientes(metricas);
  const supabase = await createClient();

  const desde30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { count: novos } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .gte("criado_em", desde30);

  const { data: pontos } = await supabase
    .from("loyalty_points")
    .select("tipo, points")
    .eq("empresa_id", empresa.id);

  let emitidos = 0;
  let resgatados = 0;
  for (const p of pontos ?? []) {
    if (p.tipo === "acumulo" || p.tipo === "boas_vindas") emitidos += Number(p.points);
    if (p.tipo === "resgate") resgatados += Math.abs(Number(p.points));
  }

  const { data: cashbacks } = await supabase
    .from("cashback_transactions")
    .select("tipo, amount")
    .eq("empresa_id", empresa.id)
    .eq("tipo", "credito");
  const cashbackConcedido = (cashbacks ?? []).reduce((s, c) => s + Number(c.amount), 0);

  const { count: cuponsUsados } = await supabase
    .from("coupon_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id);

  const ativos = metricas.filter((m) => m.ativo && (m.diasDesdeUltimaCompra ?? 999) < 45);
  const comCompra = metricas.filter((m) => m.quantidadeCompras > 0);
  const recorrentes = metricas.filter((m) => m.quantidadeCompras >= 2);
  const ticketMedio =
    comCompra.length > 0
      ? comCompra.reduce((s, m) => s + m.ticketMedio, 0) / comCompra.length
      : 0;
  const frequenciaMedia =
    comCompra.length > 0
      ? comCompra.reduce((s, m) => s + m.quantidadeCompras, 0) / comCompra.length
      : 0;

  const dash = calcularDashboardCrm({
    totalClientes: metricas.length,
    novosClientes: novos ?? 0,
    ativos: ativos.length,
    inativos: segs.inativos.length,
    ticketMedio: Math.round(ticketMedio * 100) / 100,
    frequenciaMedia: Math.round(frequenciaMedia * 100) / 100,
    taxaRetorno:
      comCompra.length > 0
        ? Math.round((recorrentes.length / comCompra.length) * 10000) / 100
        : 0,
    cuponsUsados: cuponsUsados ?? 0,
    pontosEmitidos: Math.round(emitidos * 100) / 100,
    pontosResgatados: Math.round(resgatados * 100) / 100,
    cashbackConcedido: Math.round(cashbackConcedido * 100) / 100,
  });

  return { ...dash, segmentos: segs };
}
