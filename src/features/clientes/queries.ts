import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export interface ListarClientesParams {
  busca?: string;
  ativo?: "true" | "false" | "todos";
  page?: number;
}

export async function listarClientes({
  busca,
  ativo = "true",
  page = 1,
}: ListarClientesParams): Promise<PaginatedResult<Tables<"clientes">>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("clientes")
    .select("*", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (busca) {
    query = query.ilike("nome", `%${busca}%`);
  }

  if (ativo !== "todos") {
    query = query.eq("ativo", ativo === "true");
  }

  const { data, error, count } = await query
    .order("nome", { ascending: true })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: data ?? [],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export async function listarClientesAtivosParaSelecao(): Promise<
  Tables<"clientes">[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}

export async function buscarClientePorId(
  id: string,
): Promise<Tables<"clientes"> | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface PedidoDoCliente {
  id: string;
  dataVenda: string;
  fichaTecnicaNome: string;
  canalNome: string | null;
  quantidade: number;
  valorTotal: number;
}

export interface EstatisticasCliente {
  totalGasto: number;
  quantidadeCompras: number;
  ticketMedio: number;
  ultimaCompra: string | null;
  pedidos: PedidoDoCliente[];
}

/**
 * Ticket médio, frequência e última compra NÃO são colunas de `clientes` —
 * são sempre derivadas de `vendas` aqui, na hora da leitura, para não
 * duplicar dado que já existe em outra tabela (mesmo princípio de
 * estoque_saldos ser só cache derivável de estoque_lotes).
 */
export async function buscarEstatisticasCliente(
  clienteId: string,
): Promise<EstatisticasCliente> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { totalGasto: 0, quantidadeCompras: 0, ticketMedio: 0, ultimaCompra: null, pedidos: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendas")
    .select(
      "id, data_venda, quantidade, valor_total, fichas_tecnicas(nome), canais_venda(nome)",
    )
    .eq("empresa_id", empresa.id)
    .eq("cliente_id", clienteId)
    .order("data_venda", { ascending: false });

  if (error) throw error;

  const linhas = (data ?? []) as unknown as Array<{
    id: string;
    data_venda: string;
    quantidade: number;
    valor_total: number | null;
    fichas_tecnicas: { nome: string } | null;
    canais_venda: { nome: string } | null;
  }>;

  const pedidos: PedidoDoCliente[] = linhas.map((linha) => ({
    id: linha.id,
    dataVenda: linha.data_venda,
    fichaTecnicaNome: linha.fichas_tecnicas?.nome ?? "—",
    canalNome: linha.canais_venda?.nome ?? null,
    quantidade: linha.quantidade,
    valorTotal: linha.valor_total ?? 0,
  }));

  const totalGasto = pedidos.reduce((total, pedido) => total + pedido.valorTotal, 0);
  const quantidadeCompras = pedidos.length;

  return {
    totalGasto,
    quantidadeCompras,
    ticketMedio: quantidadeCompras > 0 ? totalGasto / quantidadeCompras : 0,
    ultimaCompra: pedidos[0]?.dataVenda ?? null,
    pedidos,
  };
}
