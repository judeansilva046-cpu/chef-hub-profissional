import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type VendaComRelacoes = Tables<"vendas"> & {
  fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome">;
  canais_venda: Pick<Tables<"canais_venda">, "id" | "nome"> | null;
  clientes: Pick<Tables<"clientes">, "id" | "nome"> | null;
};

export interface ListarVendasParams {
  dataInicio?: string;
  dataFim?: string;
  canalVendaId?: string;
  clienteId?: string;
  page?: number;
}

const SELECT_VENDA_COM_RELACOES =
  "*, fichas_tecnicas(id, nome), canais_venda(id, nome), clientes(id, nome)";

export async function listarVendas({
  dataInicio,
  dataFim,
  canalVendaId,
  clienteId,
  page = 1,
}: ListarVendasParams): Promise<PaginatedResult<VendaComRelacoes>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("vendas")
    .select(SELECT_VENDA_COM_RELACOES, { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (dataInicio) query = query.gte("data_venda", dataInicio);
  if (dataFim) query = query.lte("data_venda", dataFim);
  if (canalVendaId) query = query.eq("canal_venda_id", canalVendaId);
  if (clienteId) query = query.eq("cliente_id", clienteId);

  const { data, error, count } = await query
    .order("data_venda", { ascending: false })
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as VendaComRelacoes[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export interface VendaAgregavel {
  ficha_tecnica_id: string;
  canal_venda_id: string | null;
  cliente_id: string | null;
  quantidade: number;
  valor_total: number;
  margem_total: number;
  custo_unitario_snapshot: number;
  data_venda: string;
}

/**
 * Sem paginação: retorna TODAS as vendas do período para agregação
 * (faturamento/CMV/margem realizados, produtos mais/menos rentáveis,
 * comparativo por canal). Reaproveitada pelo Dashboard e pelos Relatórios —
 * nenhum dos dois reimplementa a busca, só agregam o mesmo retorno de
 * formas diferentes.
 */
export async function buscarVendasPorPeriodo({
  dataInicio,
  dataFim,
  canalVendaId,
}: {
  dataInicio: string;
  dataFim: string;
  canalVendaId?: string;
}): Promise<VendaAgregavel[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("vendas")
    .select(
      "ficha_tecnica_id, canal_venda_id, cliente_id, quantidade, valor_total, margem_total, custo_unitario_snapshot, data_venda",
    )
    .eq("empresa_id", empresa.id)
    .gte("data_venda", dataInicio)
    .lte("data_venda", dataFim);

  if (canalVendaId) query = query.eq("canal_venda_id", canalVendaId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((linha) => ({
    ficha_tecnica_id: linha.ficha_tecnica_id,
    canal_venda_id: linha.canal_venda_id,
    cliente_id: linha.cliente_id,
    quantidade: linha.quantidade,
    valor_total: linha.valor_total ?? 0,
    margem_total: linha.margem_total ?? 0,
    custo_unitario_snapshot: linha.custo_unitario_snapshot,
    data_venda: linha.data_venda,
  }));
}

export async function buscarVendaPorId(
  id: string,
): Promise<VendaComRelacoes | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .select(SELECT_VENDA_COM_RELACOES)
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as VendaComRelacoes | null;
}
