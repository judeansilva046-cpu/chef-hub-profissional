import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

/** Caixa aberto do operador logado — reaproveitada pelo PDV (só um caixa aberto por operador, ver caixas_operador_aberto_key, 0031). */
export async function buscarCaixaAbertoDoOperador(): Promise<Tables<"caixas"> | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("caixas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("operador_id", user.id)
    .eq("status", "aberto")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type CaixaComOperador = Tables<"caixas"> & {
  profiles: Pick<Tables<"profiles">, "id" | "nome_completo"> | null;
};

export async function listarCaixas({ page = 1 }: { page?: number }): Promise<PaginatedResult<CaixaComOperador>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("caixas")
    .select("*, profiles(id, nome_completo)", { count: "exact" })
    .eq("empresa_id", empresa.id)
    .order("aberto_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as CaixaComOperador[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export interface CaixaDetalhado {
  caixa: CaixaComOperador;
  movimentacoes: Tables<"caixa_movimentacoes">[];
}

export async function buscarCaixaDetalhado(id: string): Promise<CaixaDetalhado | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const [{ data: caixa, error: erroCaixa }, { data: movimentacoes, error: erroMovimentacoes }] = await Promise.all([
    supabase
      .from("caixas")
      .select("*, profiles(id, nome_completo)")
      .eq("id", id)
      .eq("empresa_id", empresa.id)
      .maybeSingle(),
    supabase
      .from("caixa_movimentacoes")
      .select("*")
      .eq("caixa_id", id)
      .order("criado_em", { ascending: true }),
  ]);

  if (erroCaixa) throw erroCaixa;
  if (!caixa) return null;
  if (erroMovimentacoes) throw erroMovimentacoes;

  return {
    caixa: caixa as unknown as CaixaComOperador,
    movimentacoes: movimentacoes ?? [],
  };
}
