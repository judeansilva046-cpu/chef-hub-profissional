import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export async function listarListasCompra({
  page = 1,
}: { page?: number } = {}): Promise<PaginatedResult<Tables<"listas_compra">>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("listas_compra")
    .select("*", { count: "exact" })
    .eq("empresa_id", empresa.id)
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

export type ListaItemComDetalhes = Tables<"listas_compra_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
  fornecedores: Pick<Tables<"fornecedores">, "id" | "nome"> | null;
};

export type ListaCompleta = Tables<"listas_compra"> & {
  listas_compra_itens: ListaItemComDetalhes[];
};

export async function buscarListaPorId(id: string): Promise<ListaCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listas_compra")
    .select(
      `*,
      listas_compra_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla)),
        fornecedores(id, nome)
      )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as ListaCompleta;
}
