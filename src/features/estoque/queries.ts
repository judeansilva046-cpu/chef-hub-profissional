import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export interface SaldoEstoqueItem {
  ingrediente: Pick<
    Tables<"ingredientes">,
    "id" | "nome" | "estoque_minimo" | "custo_unitario_atual"
  > & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
  quantidadeAtual: number;
  custoMedioPonderado: number;
  valorEmEstoque: number;
  abaixoDoMinimo: boolean;
}

/**
 * Sem paginação de banco: a lista de saldo é 1 linha por ingrediente ativo,
 * um conjunto naturalmente limitado (o CRUD de ingredientes, esse sim
 * paginado, já é o controle de tamanho do catálogo). Comparar
 * quantidade_total (estoque_saldos) com estoque_minimo (ingredientes) exige
 * ler as duas colunas — PostgREST não filtra comparação entre colunas
 * diretamente — por isso o "abaixo do mínimo" é calculado aqui.
 */
export async function listarSaldosEstoque({
  busca,
}: { busca?: string } = {}): Promise<SaldoEstoqueItem[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("ingredientes")
    .select(
      "id, nome, estoque_minimo, custo_unitario_atual, unidades_medida(sigla), estoque_saldos(quantidade_total, custo_medio_ponderado)",
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
    estoque_minimo: number;
    custo_unitario_atual: number;
    unidades_medida: { sigla: string };
    estoque_saldos:
      | { quantidade_total: number; custo_medio_ponderado: number }[]
      | { quantidade_total: number; custo_medio_ponderado: number }
      | null;
  }>).map((row) => {
    const saldo = Array.isArray(row.estoque_saldos)
      ? row.estoque_saldos[0]
      : row.estoque_saldos;
    const quantidadeAtual = saldo?.quantidade_total ?? 0;
    const custoMedioPonderado = saldo?.custo_medio_ponderado ?? 0;

    return {
      ingrediente: {
        id: row.id,
        nome: row.nome,
        estoque_minimo: row.estoque_minimo,
        custo_unitario_atual: row.custo_unitario_atual,
        unidades_medida: row.unidades_medida,
      },
      quantidadeAtual,
      custoMedioPonderado,
      valorEmEstoque: quantidadeAtual * custoMedioPonderado,
      abaixoDoMinimo: quantidadeAtual < row.estoque_minimo,
    };
  });
}

export interface ResumoEstoque {
  totalIngredientes: number;
  ingredientesAbaixoDoMinimo: number;
  lotesVencendoEm7Dias: number;
  valorTotalEmEstoque: number;
}

export async function buscarResumoEstoque(): Promise<ResumoEstoque> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      totalIngredientes: 0,
      ingredientesAbaixoDoMinimo: 0,
      lotesVencendoEm7Dias: 0,
      valorTotalEmEstoque: 0,
    };
  }

  const [saldos, lotesVencendoEm7Dias] = await Promise.all([
    listarSaldosEstoque(),
    contarLotesVencendoEm(7),
  ]);

  return {
    totalIngredientes: saldos.length,
    ingredientesAbaixoDoMinimo: saldos.filter((item) => item.abaixoDoMinimo)
      .length,
    lotesVencendoEm7Dias,
    valorTotalEmEstoque: saldos.reduce(
      (total, item) => total + item.valorEmEstoque,
      0,
    ),
  };
}

async function contarLotesVencendoEm(dias: number): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;

  const supabase = await createClient();
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  const limiteIso = limite.toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from("estoque_lotes")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .gt("quantidade_atual", 0)
    .not("data_validade", "is", null)
    .lte("data_validade", limiteIso);

  if (error) throw error;
  return count ?? 0;
}

export type MovimentacaoComIngrediente = Tables<"estoque_movimentacoes"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export interface ListarMovimentacoesParams {
  busca?: string;
  tipo?: string;
  page?: number;
}

export async function listarMovimentacoesEstoque({
  busca,
  tipo = "todos",
  page = 1,
}: ListarMovimentacoesParams): Promise<
  PaginatedResult<MovimentacaoComIngrediente>
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
    .from("estoque_movimentacoes")
    .select("*, ingredientes!inner(id, nome, unidades_medida(sigla))", {
      count: "exact",
    })
    .eq("empresa_id", empresa.id);

  if (busca) {
    query = query.ilike("ingredientes.nome", `%${busca}%`);
  }

  if (tipo !== "todos") {
    query = query.eq("tipo", tipo);
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as MovimentacaoComIngrediente[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type LoteComIngrediente = Tables<"estoque_lotes"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export interface ListarLotesParams {
  busca?: string;
  page?: number;
}

export async function listarLotesEstoque({
  busca,
  page = 1,
}: ListarLotesParams): Promise<PaginatedResult<LoteComIngrediente>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("estoque_lotes")
    .select("*, ingredientes!inner(id, nome, unidades_medida(sigla))", {
      count: "exact",
    })
    .eq("empresa_id", empresa.id)
    .gt("quantidade_atual", 0);

  if (busca) {
    query = query.ilike("ingredientes.nome", `%${busca}%`);
  }

  const { data, error, count } = await query
    .order("data_validade", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as LoteComIngrediente[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export async function listarInventarios({
  page = 1,
}: { page?: number } = {}): Promise<
  PaginatedResult<Tables<"estoque_inventarios">>
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("estoque_inventarios")
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

export type InventarioItemComIngrediente = Tables<"estoque_inventario_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export type InventarioCompleto = Tables<"estoque_inventarios"> & {
  estoque_inventario_itens: InventarioItemComIngrediente[];
};

export async function buscarInventarioPorId(
  id: string,
): Promise<InventarioCompleto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estoque_inventarios")
    .select(
      `*,
      estoque_inventario_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla))
      )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as InventarioCompleto;
}
