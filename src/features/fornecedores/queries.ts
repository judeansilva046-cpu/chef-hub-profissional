import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export interface ListarFornecedoresParams {
  busca?: string;
  ativo?: "true" | "false" | "todos";
  page?: number;
}

export async function listarFornecedores({
  busca,
  ativo = "true",
  page = 1,
}: ListarFornecedoresParams): Promise<PaginatedResult<Tables<"fornecedores">>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("fornecedores")
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

export async function listarFornecedoresAtivosParaSelecao(): Promise<
  Tables<"fornecedores">[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}

export async function buscarFornecedorPorId(id: string): Promise<Tables<"fornecedores"> | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type FornecedorScore = Tables<"compras_fornecedores_score">;

export async function buscarScoreFornecedor(fornecedorId: string): Promise<FornecedorScore | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_fornecedores_score")
    .select("*")
    .eq("fornecedor_id", fornecedorId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listarAvaliacoesFornecedor(fornecedorId: string): Promise<Tables<"compras_avaliacoes_fornecedor">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_avaliacoes_fornecedor")
    .select("*")
    .eq("fornecedor_id", fornecedorId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listarAnexos(
  referenciaTipo: "fornecedor" | "solicitacao_compra" | "pedido_compra" | "recebimento",
  referenciaId: string,
): Promise<Tables<"compras_anexos">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_anexos")
    .select("*")
    .eq("referencia_tipo", referenciaTipo)
    .eq("referencia_id", referenciaId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
