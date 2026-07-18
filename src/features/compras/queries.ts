import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export interface ListarSolicitacoesParams {
  status?: string;
  page?: number;
}

export async function listarSolicitacoesCompra({
  status = "todos",
  page = 1,
}: ListarSolicitacoesParams): Promise<
  PaginatedResult<Tables<"solicitacoes_compra">>
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("solicitacoes_compra")
    .select("*", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
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

export type SolicitacaoItemComIngrediente = Tables<"solicitacoes_compra_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export type SolicitacaoCompleta = Tables<"solicitacoes_compra"> & {
  solicitacoes_compra_itens: SolicitacaoItemComIngrediente[];
};

export async function buscarSolicitacaoPorId(
  id: string,
): Promise<SolicitacaoCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitacoes_compra")
    .select(
      `*,
      solicitacoes_compra_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla))
      )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as SolicitacaoCompleta;
}

export interface ListarPedidosParams {
  status?: string;
  page?: number;
}

export type PedidoComFornecedor = Tables<"pedidos_compra"> & {
  fornecedores: Pick<Tables<"fornecedores">, "id" | "nome">;
};

export async function listarPedidosCompra({
  status = "todos",
  page = 1,
}: ListarPedidosParams): Promise<PaginatedResult<PedidoComFornecedor>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("pedidos_compra")
    .select("*, fornecedores(id, nome)", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as PedidoComFornecedor[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type PedidoItemComIngrediente = Tables<"pedidos_compra_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export type PedidoCompleto = Tables<"pedidos_compra"> & {
  fornecedores: Pick<Tables<"fornecedores">, "id" | "nome">;
  pedidos_compra_itens: PedidoItemComIngrediente[];
};

export async function buscarPedidoPorId(
  id: string,
): Promise<PedidoCompleto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select(
      `*,
      fornecedores(id, nome),
      pedidos_compra_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla))
      )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as PedidoCompleto;
}

export interface PrecoFornecedorItem {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  precoUnitario: number;
  atualizadoEm: string;
}

export interface ComparativoPrecoIngrediente {
  ingredienteId: string;
  ingredienteNome: string;
  unidadeSigla: string;
  precos: PrecoFornecedorItem[];
}

export async function listarComparativoPrecos({
  busca,
}: { busca?: string } = {}): Promise<ComparativoPrecoIngrediente[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("ingredientes")
    .select(
      "id, nome, unidades_medida(sigla), fornecedor_ingredientes(id, fornecedor_id, preco_unitario, atualizado_em, fornecedores(nome))",
    )
    .eq("empresa_id", empresa.id)
    .eq("ativo", true);

  if (busca) {
    query = query.ilike("nome", `%${busca}%`);
  }

  const { data, error } = await query.order("nome", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    nome: string;
    unidades_medida: { sigla: string };
    fornecedor_ingredientes: Array<{
      id: string;
      fornecedor_id: string;
      preco_unitario: number;
      atualizado_em: string;
      fornecedores: { nome: string };
    }>;
  }>).map((row) => ({
    ingredienteId: row.id,
    ingredienteNome: row.nome,
    unidadeSigla: row.unidades_medida.sigla,
    precos: row.fornecedor_ingredientes
      .map((preco) => ({
        id: preco.id,
        fornecedorId: preco.fornecedor_id,
        fornecedorNome: preco.fornecedores.nome,
        precoUnitario: preco.preco_unitario,
        atualizadoEm: preco.atualizado_em,
      }))
      .sort((a, b) => a.precoUnitario - b.precoUnitario),
  }));
}
