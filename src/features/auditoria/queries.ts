import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type AuditoriaComUsuario = Tables<"financeiro_auditoria"> & {
  profiles: Pick<Tables<"profiles">, "nome_completo"> | null;
};

export interface ListarAuditoriaParams {
  tabela?: string;
  page?: number;
}

/**
 * Log de auditoria das tabelas do Financeiro (0043) — gravado só por trigger, nunca escrito pelo app.
 * `profiles` tem policy de leitura "só a própria linha" (0002), então um embed `financeiro_auditoria(profiles(...))`
 * voltaria nulo pra ações de outros membros da empresa — por isso o nome vem à parte, via
 * `fn_perfis_visiveis_financeiro` (SECURITY DEFINER, 0044).
 */
export async function listarAuditoriaFinanceira({
  tabela,
  page = 1,
}: ListarAuditoriaParams): Promise<PaginatedResult<AuditoriaComUsuario>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("financeiro_auditoria")
    .select("*", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (tabela) query = query.eq("tabela", tabela);

  const [{ data, error, count }, { data: perfis, error: perfisError }] = await Promise.all([
    query.order("criado_em", { ascending: false }).range(from, to),
    supabase.rpc("fn_perfis_visiveis_financeiro", { p_empresa_id: empresa.id }),
  ]);

  if (error) throw error;
  if (perfisError) throw perfisError;

  const perfisPorId = new Map((perfis ?? []).map((perfil) => [perfil.id, perfil]));
  const totalCount = count ?? 0;

  return {
    data: (data ?? []).map((linha) => ({
      ...linha,
      profiles: perfisPorId.has(linha.usuario_id ?? "")
        ? { nome_completo: perfisPorId.get(linha.usuario_id ?? "")!.nome_completo }
        : null,
    })),
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}
