import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type IngredienteComRelacoes = Tables<"ingredientes"> & {
  categorias_ingredientes: Pick<
    Tables<"categorias_ingredientes">,
    "id" | "nome"
  > | null;
  unidades_medida: Pick<Tables<"unidades_medida">, "id" | "nome" | "sigla">;
};

export interface ListarIngredientesParams {
  busca?: string;
  categoriaId?: string;
  ativo?: "true" | "false" | "todos";
  page?: number;
}

export async function listarIngredientes({
  busca,
  categoriaId,
  ativo = "true",
  page = 1,
}: ListarIngredientesParams): Promise<PaginatedResult<IngredienteComRelacoes>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      data: [],
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("ingredientes")
    .select(
      "*, categorias_ingredientes(id, nome), unidades_medida(id, nome, sigla)",
      { count: "exact" },
    )
    .eq("empresa_id", empresa.id);

  if (busca) {
    query = query.ilike("nome", `%${busca}%`);
  }

  if (categoriaId) {
    query = query.eq("categoria_id", categoriaId);
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
    data: (data ?? []) as unknown as IngredienteComRelacoes[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type IngredienteParaSelecao = Pick<
  Tables<"ingredientes">,
  "id" | "nome" | "unidade_medida_id" | "custo_unitario_atual"
> & {
  unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
};

export async function listarIngredientesAtivosParaSelecao(): Promise<
  IngredienteParaSelecao[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredientes")
    .select(
      "id, nome, unidade_medida_id, custo_unitario_atual, unidades_medida(sigla)",
    )
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data as unknown as IngredienteParaSelecao[];
}
