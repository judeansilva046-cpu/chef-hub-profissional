import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type ContaPagarComRelacoes = Tables<"contas_pagar"> & {
  fornecedores: Pick<Tables<"fornecedores">, "id" | "nome"> | null;
  plano_contas: Pick<Tables<"plano_contas">, "id" | "nome" | "codigo"> | null;
  centros_custo: Pick<Tables<"centros_custo">, "id" | "nome"> | null;
  /** Derivado (status='pendente' e vencimento < hoje) — nunca persistido, ver migration 0041. */
  atrasada: boolean;
};

const SELECT_CONTA_PAGAR_COM_RELACOES =
  "*, fornecedores(id, nome), plano_contas(id, nome, codigo), centros_custo(id, nome)";

function marcarAtrasadas<T extends Tables<"contas_pagar">>(linhas: T[]): (T & { atrasada: boolean })[] {
  const hoje = new Date().toISOString().slice(0, 10);
  return linhas.map((linha) => ({
    ...linha,
    atrasada: linha.status === "pendente" && linha.data_vencimento < hoje,
  }));
}

export interface ListarContasPagarParams {
  status?: string;
  fornecedorId?: string;
  page?: number;
}

export async function listarContasPagar({
  status,
  fornecedorId,
  page = 1,
}: ListarContasPagarParams): Promise<PaginatedResult<ContaPagarComRelacoes>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("contas_pagar")
    .select(SELECT_CONTA_PAGAR_COM_RELACOES, { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);
  if (fornecedorId) query = query.eq("fornecedor_id", fornecedorId);

  const { data, error, count } = await query.order("data_vencimento", { ascending: true }).range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: marcarAtrasadas((data ?? []) as unknown as ContaPagarComRelacoes[]),
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

/** Mesma consulta de listarContasPagar, sem paginação — usada só pela exportação PDF/Excel (nunca pela tela, que sempre pagina). */
export async function listarContasPagarParaExportacao({
  status,
  fornecedorId,
}: Pick<ListarContasPagarParams, "status" | "fornecedorId">): Promise<ContaPagarComRelacoes[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("contas_pagar")
    .select(SELECT_CONTA_PAGAR_COM_RELACOES)
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);
  if (fornecedorId) query = query.eq("fornecedor_id", fornecedorId);

  const { data, error } = await query.order("data_vencimento", { ascending: true });
  if (error) throw error;

  return marcarAtrasadas((data ?? []) as unknown as ContaPagarComRelacoes[]);
}

export async function buscarContaPagarPorId(id: string): Promise<ContaPagarComRelacoes | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contas_pagar")
    .select(SELECT_CONTA_PAGAR_COM_RELACOES)
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return marcarAtrasadas([data as unknown as Tables<"contas_pagar">])[0] as ContaPagarComRelacoes;
}

export interface ResumoContasPagar {
  totalPendente: number;
  totalAtrasado: number;
  totalPagoNoMes: number;
  quantidadePendente: number;
}

/** Resumo para o Dashboard Financeiro/Fluxo de Caixa — reaproveitado por várias telas, não recalculado em cada uma. */
export async function resumirContasPagar(): Promise<ResumoContasPagar> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { totalPendente: 0, totalAtrasado: 0, totalPagoNoMes: 0, quantidadePendente: 0 };

  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoje.slice(0, 7)}-01`;

  const [{ data: pendentes }, { data: pagasNoMes }] = await Promise.all([
    supabase.from("contas_pagar").select("valor, data_vencimento").eq("empresa_id", empresa.id).eq("status", "pendente"),
    supabase
      .from("contas_pagar")
      .select("valor_pago")
      .eq("empresa_id", empresa.id)
      .eq("status", "pago")
      .gte("data_pagamento", inicioMes),
  ]);

  const totalPendente = (pendentes ?? []).reduce((total, item) => total + item.valor, 0);
  const totalAtrasado = (pendentes ?? [])
    .filter((item) => item.data_vencimento < hoje)
    .reduce((total, item) => total + item.valor, 0);
  const totalPagoNoMes = (pagasNoMes ?? []).reduce((total, item) => total + (item.valor_pago ?? 0), 0);

  return {
    totalPendente,
    totalAtrasado,
    totalPagoNoMes,
    quantidadePendente: (pendentes ?? []).length,
  };
}
