import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { calcularFluxoCaixaPorMes, type FluxoCaixaMes } from "./calculations";

export interface BuscarFluxoCaixaParams {
  dataInicio: string;
  dataFim: string;
}

/** Combina caixa_movimentacoes (realizado, Sprint 05) + contas_pagar/contas_receber_parcelas pendentes (projetado, Sprint 06) — nenhuma tabela nova, só agregação. */
export async function buscarFluxoCaixaPorMes({
  dataInicio,
  dataFim,
}: BuscarFluxoCaixaParams): Promise<FluxoCaixaMes[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();

  const [{ data: movimentacoes }, { data: parcelasReceber }, { data: contasPagar }] = await Promise.all([
    supabase
      .from("caixa_movimentacoes")
      .select("tipo, valor, criado_em")
      .eq("empresa_id", empresa.id)
      .gte("criado_em", dataInicio)
      .lte("criado_em", `${dataFim}T23:59:59`),
    supabase
      .from("contas_receber_parcelas")
      .select("valor, data_vencimento")
      .eq("empresa_id", empresa.id)
      .eq("status", "pendente")
      .gte("data_vencimento", dataInicio)
      .lte("data_vencimento", dataFim),
    supabase
      .from("contas_pagar")
      .select("valor, data_vencimento")
      .eq("empresa_id", empresa.id)
      .eq("status", "pendente")
      .gte("data_vencimento", dataInicio)
      .lte("data_vencimento", dataFim),
  ]);

  return calcularFluxoCaixaPorMes(movimentacoes ?? [], parcelasReceber ?? [], contasPagar ?? []);
}
