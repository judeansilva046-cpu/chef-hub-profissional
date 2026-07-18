import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type ContaReceberComRelacoes = Tables<"contas_receber"> & {
  clientes: Pick<Tables<"clientes">, "id" | "nome"> | null;
  plano_contas: Pick<Tables<"plano_contas">, "id" | "nome" | "codigo"> | null;
  centros_custo: Pick<Tables<"centros_custo">, "id" | "nome"> | null;
  contas_receber_parcelas: Tables<"contas_receber_parcelas">[];
};

const SELECT_CONTA_RECEBER_COM_RELACOES =
  "*, clientes(id, nome), plano_contas(id, nome, codigo), centros_custo(id, nome), contas_receber_parcelas(*)";

export interface ListarContasReceberParams {
  status?: string;
  clienteId?: string;
  page?: number;
}

export async function listarContasReceber({
  status,
  clienteId,
  page = 1,
}: ListarContasReceberParams): Promise<PaginatedResult<ContaReceberComRelacoes>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("contas_receber")
    .select(SELECT_CONTA_RECEBER_COM_RELACOES, { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);
  if (clienteId) query = query.eq("cliente_id", clienteId);

  const { data, error, count } = await query.order("data_emissao", { ascending: false }).range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as ContaReceberComRelacoes[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

/** Mesma consulta de listarContasReceber, sem paginação — usada só pela exportação PDF/Excel (nunca pela tela, que sempre pagina). */
export async function listarContasReceberParaExportacao({
  status,
  clienteId,
}: Pick<ListarContasReceberParams, "status" | "clienteId">): Promise<ContaReceberComRelacoes[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("contas_receber")
    .select(SELECT_CONTA_RECEBER_COM_RELACOES)
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);
  if (clienteId) query = query.eq("cliente_id", clienteId);

  const { data, error } = await query.order("data_emissao", { ascending: false });
  if (error) throw error;

  return (data ?? []) as unknown as ContaReceberComRelacoes[];
}

export interface ResumoContasReceber {
  totalPendente: number;
  totalAtrasado: number;
  totalRecebidoNoMes: number;
  quantidadePendente: number;
}

export async function resumirContasReceber(): Promise<ResumoContasReceber> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { totalPendente: 0, totalAtrasado: 0, totalRecebidoNoMes: 0, quantidadePendente: 0 };

  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoje.slice(0, 7)}-01`;

  const [{ data: pendentes }, { data: recebidasNoMes }] = await Promise.all([
    supabase
      .from("contas_receber_parcelas")
      .select("valor, data_vencimento")
      .eq("empresa_id", empresa.id)
      .eq("status", "pendente"),
    supabase
      .from("contas_receber_parcelas")
      .select("valor_recebido")
      .eq("empresa_id", empresa.id)
      .eq("status", "recebido")
      .gte("data_recebimento", inicioMes),
  ]);

  const totalPendente = (pendentes ?? []).reduce((total, item) => total + item.valor, 0);
  const totalAtrasado = (pendentes ?? [])
    .filter((item) => item.data_vencimento < hoje)
    .reduce((total, item) => total + item.valor, 0);
  const totalRecebidoNoMes = (recebidasNoMes ?? []).reduce((total, item) => total + (item.valor_recebido ?? 0), 0);

  return {
    totalPendente,
    totalAtrasado,
    totalRecebidoNoMes,
    quantidadePendente: (pendentes ?? []).length,
  };
}
