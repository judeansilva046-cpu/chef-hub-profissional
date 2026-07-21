import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type LoteParaEtiqueta = Tables<"estoque_lotes"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

/** Lotes ativos (quantidade_atual > 0) disponíveis para gerar etiqueta — mesmo filtro de listarLotesEstoque, sem paginação (combobox). */
export async function listarLotesParaEtiqueta(): Promise<LoteParaEtiqueta[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estoque_lotes")
    .select("*, ingredientes!inner(id, nome, unidades_medida(sigla))")
    .eq("empresa_id", empresa.id)
    .gt("quantidade_atual", 0)
    .order("data_validade", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as unknown as LoteParaEtiqueta[];
}

export type EtiquetaComRelacoes = Tables<"etiquetas_impressas"> & {
  estoque_lotes: (Pick<Tables<"estoque_lotes">, "id" | "numero_lote" | "data_validade"> & {
    ingredientes: Pick<Tables<"ingredientes">, "nome">;
  }) | null;
};

export interface ListarEtiquetasParams {
  page?: number;
}

export async function listarEtiquetasEmitidas({
  page = 1,
}: ListarEtiquetasParams): Promise<PaginatedResult<EtiquetaComRelacoes>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("etiquetas_impressas")
    .select("*, estoque_lotes(id, numero_lote, data_validade, ingredientes(nome))", {
      count: "exact",
    })
    .eq("empresa_id", empresa.id)
    .order("emitido_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as EtiquetaComRelacoes[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type AgenteImpressaoListagem = Omit<Tables<"agentes_impressao">, "chave_api_hash">;

export async function listarAgentesImpressao(): Promise<AgenteImpressaoListagem[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agentes_impressao")
    .select("id, empresa_id, nome, ativo, ultimo_ping_em, criado_em, atualizado_em")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data;
}

export interface ResumoFilaImpressao {
  pendentes: number;
  processando: number;
  erro: number;
}

export async function buscarResumoFilaImpressao(): Promise<ResumoFilaImpressao> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { pendentes: 0, processando: 0, erro: 0 };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fila_impressao")
    .select("status")
    .eq("empresa_id", empresa.id)
    .in("status", ["pendente", "processando", "erro"]);

  if (error) throw error;

  const linhas = data ?? [];
  return {
    pendentes: linhas.filter((linha) => linha.status === "pendente").length,
    processando: linhas.filter((linha) => linha.status === "processando").length,
    erro: linhas.filter((linha) => linha.status === "erro").length,
  };
}
