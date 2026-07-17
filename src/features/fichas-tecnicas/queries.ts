import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type FichaTecnicaComRendimento = Tables<"fichas_tecnicas"> & {
  unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
};

export interface ListarFichasTecnicasParams {
  busca?: string;
  ativo?: "true" | "false" | "todos";
  page?: number;
}

export async function listarFichasTecnicas({
  busca,
  ativo = "true",
  page = 1,
}: ListarFichasTecnicasParams): Promise<
  PaginatedResult<FichaTecnicaComRendimento>
> {
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
    .from("fichas_tecnicas")
    .select("*, unidades_medida(sigla)", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (busca) {
    query = query.ilike("nome", `%${busca}%`);
  }

  if (ativo !== "todos") {
    query = query.eq("ativo", ativo === "true");
  }

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as FichaTecnicaComRendimento[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type FichaTecnicaParaSelecao = Pick<
  Tables<"fichas_tecnicas">,
  "id" | "nome" | "rendimento_quantidade"
> & {
  unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
};

export async function listarFichasTecnicasAtivasParaSelecao(): Promise<
  FichaTecnicaParaSelecao[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas")
    .select("id, nome, rendimento_quantidade, unidades_medida(sigla)")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data as unknown as FichaTecnicaParaSelecao[];
}

export type FichaTecnicaItemComIngrediente = Tables<"fichas_tecnicas_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export type FichaTecnicaCompleta = Tables<"fichas_tecnicas"> & {
  unidades_medida: Pick<Tables<"unidades_medida">, "id" | "nome" | "sigla">;
  fichas_tecnicas_itens: FichaTecnicaItemComIngrediente[];
};

export async function buscarFichaTecnicaPorId(
  id: string,
): Promise<FichaTecnicaCompleta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas")
    .select(
      `*,
      unidades_medida(id, nome, sigla),
      fichas_tecnicas_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla))
      )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as FichaTecnicaCompleta;
}

export async function listarVersoesFichaTecnica(
  fichaTecnicaId: string,
): Promise<Tables<"fichas_tecnicas_versoes">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas_versoes")
    .select("*")
    .eq("ficha_tecnica_id", fichaTecnicaId)
    .order("numero_versao", { ascending: false });

  if (error) throw error;
  return data;
}
