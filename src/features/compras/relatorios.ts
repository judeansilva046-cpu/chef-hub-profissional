import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export interface SolicitacaoRelatorioLinha {
  numero: number | null;
  criadoEm: string;
  setor: string | null;
  prioridade: string;
  status: string;
  valorEstimado: number;
}

export async function listarSolicitacoesParaExportacao(
  status?: string,
): Promise<SolicitacaoRelatorioLinha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("solicitacoes_compra")
    .select("numero, criado_em, setor, prioridade, status, solicitacoes_compra_itens(quantidade, preco_estimado)")
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("criado_em", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    numero: s.numero,
    criadoEm: s.criado_em,
    setor: s.setor,
    prioridade: s.prioridade,
    status: s.status,
    valorEstimado: s.solicitacoes_compra_itens.reduce(
      (soma, item) => soma + item.quantidade * (item.preco_estimado ?? 0),
      0,
    ),
  }));
}

export interface CotacaoRelatorioLinha {
  numero: number | null;
  criadoEm: string;
  status: string;
  fornecedorVencedor: string | null;
  escolhaAutomatica: boolean;
  quantidadeFornecedores: number;
}

export async function listarCotacoesParaExportacao(
  status?: string,
): Promise<CotacaoRelatorioLinha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("compras_cotacoes")
    .select(
      "numero, criado_em, status, escolha_automatica, fornecedor_vencedor:fornecedores!compras_cotacoes_fornecedor_vencedor_id_fkey(nome), compras_cotacoes_fornecedores(id)",
    )
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("criado_em", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    numero: number | null;
    criado_em: string;
    status: string;
    escolha_automatica: boolean;
    fornecedor_vencedor: { nome: string } | null;
    compras_cotacoes_fornecedores: Array<{ id: string }>;
  }>).map((c) => ({
    numero: c.numero,
    criadoEm: c.criado_em,
    status: c.status,
    fornecedorVencedor: c.fornecedor_vencedor?.nome ?? null,
    escolhaAutomatica: c.escolha_automatica,
    quantidadeFornecedores: c.compras_cotacoes_fornecedores.length,
  }));
}

export interface PedidoRelatorioLinha {
  numero: number | null;
  criadoEm: string;
  fornecedor: string;
  centroCusto: string | null;
  status: string;
  total: number;
}

export async function listarPedidosParaExportacao(
  status?: string,
): Promise<PedidoRelatorioLinha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("pedidos_compra")
    .select("numero, criado_em, total, status, fornecedores(nome), centros_custo(nome)")
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("criado_em", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    numero: number | null;
    criado_em: string;
    total: number;
    status: string;
    fornecedores: { nome: string };
    centros_custo: { nome: string } | null;
  }>).map((p) => ({
    numero: p.numero,
    criadoEm: p.criado_em,
    fornecedor: p.fornecedores.nome,
    centroCusto: p.centros_custo?.nome ?? null,
    status: p.status,
    total: p.total,
  }));
}

export interface DivergenciaRelatorioLinha {
  criadoEm: string;
  pedidoNumero: number | null;
  fornecedor: string;
  ingrediente: string;
  quantidadeRecusada: number;
  motivo: string | null;
}

export async function listarDivergenciasParaExportacao(): Promise<DivergenciaRelatorioLinha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_recebimentos_itens")
    .select(
      `quantidade_recusada, motivo_divergencia,
      compras_recebimentos(criado_em, pedidos_compra(numero, fornecedores(nome))),
      pedidos_compra_itens(ingredientes(nome))`,
    )
    .eq("empresa_id", empresa.id)
    .eq("divergencia", true);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    quantidade_recusada: number;
    motivo_divergencia: string | null;
    compras_recebimentos: { criado_em: string; pedidos_compra: { numero: number | null; fornecedores: { nome: string } } };
    pedidos_compra_itens: { ingredientes: { nome: string } };
  }>)
    .map((d) => ({
      criadoEm: d.compras_recebimentos.criado_em,
      pedidoNumero: d.compras_recebimentos.pedidos_compra.numero,
      fornecedor: d.compras_recebimentos.pedidos_compra.fornecedores.nome,
      ingrediente: d.pedidos_compra_itens.ingredientes.nome,
      quantidadeRecusada: d.quantidade_recusada,
      motivo: d.motivo_divergencia,
    }))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export interface HistoricoPrecoRelatorioLinha {
  dataReferencia: string;
  ingrediente: string;
  fornecedor: string;
  precoUnitario: number;
}

export async function listarHistoricoPrecosParaExportacao(): Promise<HistoricoPrecoRelatorioLinha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedor_ingredientes_historico_precos")
    .select(
      "data_referencia, preco_unitario, fornecedor_ingredientes(ingredientes(nome), fornecedores(nome))",
    )
    .eq("empresa_id", empresa.id)
    .order("data_referencia", { ascending: false })
    .limit(500);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    data_referencia: string;
    preco_unitario: number;
    fornecedor_ingredientes: { ingredientes: { nome: string }; fornecedores: { nome: string } };
  }>).map((h) => ({
    dataReferencia: h.data_referencia,
    ingrediente: h.fornecedor_ingredientes.ingredientes.nome,
    fornecedor: h.fornecedor_ingredientes.fornecedores.nome,
    precoUnitario: h.preco_unitario,
  }));
}

export interface AvaliacaoRelatorioLinha {
  criadoEm: string;
  fornecedor: string;
  pontualidade: number;
  qualidade: number;
  preco: number;
  atendimento: number;
  comentario: string | null;
}

export async function listarAvaliacoesParaExportacao(): Promise<AvaliacaoRelatorioLinha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_avaliacoes_fornecedor")
    .select("criado_em, pontualidade, qualidade, preco, atendimento, comentario, fornecedores(nome)")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    criado_em: string;
    pontualidade: number;
    qualidade: number;
    preco: number;
    atendimento: number;
    comentario: string | null;
    fornecedores: { nome: string };
  }>).map((a) => ({
    criadoEm: a.criado_em,
    fornecedor: a.fornecedores.nome,
    pontualidade: a.pontualidade,
    qualidade: a.qualidade,
    preco: a.preco,
    atendimento: a.atendimento,
    comentario: a.comentario,
  }));
}

export interface ComprasPorCentroCustoLinha {
  centroCusto: string;
  total: number;
  quantidadePedidos: number;
}

export async function listarComprasPorCentroCustoParaExportacao(): Promise<
  ComprasPorCentroCustoLinha[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select("total, centros_custo(nome)")
    .eq("empresa_id", empresa.id)
    .neq("status", "cancelado");

  if (error) throw error;

  const porCentro = new Map<string, ComprasPorCentroCustoLinha>();
  for (const row of (data ?? []) as unknown as Array<{ total: number; centros_custo: { nome: string } | null }>) {
    const nome = row.centros_custo?.nome ?? "Sem centro de custo";
    const atual = porCentro.get(nome);
    if (atual) {
      atual.total += row.total;
      atual.quantidadePedidos += 1;
    } else {
      porCentro.set(nome, { centroCusto: nome, total: row.total, quantidadePedidos: 1 });
    }
  }

  return [...porCentro.values()].sort((a, b) => b.total - a.total);
}
