import "server-only";

import { analisarVendas } from "@/features/dashboard/calculations";
import { calcularCustosVariaveisAgregados, listarCanaisVenda } from "@/features/financeiro/queries";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { calcularDRE, type DemonstrativoResultado } from "./calculations";

export interface BuscarDREParams {
  dataInicio: string;
  dataFim: string;
}

export async function buscarDRE({ dataInicio, dataFim }: BuscarDREParams): Promise<DemonstrativoResultado> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return calcularDRE(
      {
        faturamentoRealizado: 0,
        cmvRealizado: 0,
        cmvPercentual: null,
        margemRealizada: 0,
        margemPercentual: null,
        quantidadeTotal: 0,
      },
      [],
    );
  }

  const supabase = await createClient();

  const [vendas, custosVariaveisGerais, canais, { data: contasPagas }] = await Promise.all([
    buscarVendasPorPeriodo({ dataInicio, dataFim }),
    calcularCustosVariaveisAgregados(),
    listarCanaisVenda(),
    supabase
      .from("contas_pagar")
      .select("valor, valor_pago, categoria_origem")
      .eq("empresa_id", empresa.id)
      .eq("status", "pago")
      .gte("data_pagamento", dataInicio)
      .lte("data_pagamento", dataFim),
  ]);

  const canaisPorId = new Map(canais.map((canal) => [canal.id, canal]));
  const { resumo } = analisarVendas(vendas, custosVariaveisGerais, canaisPorId);

  return calcularDRE(resumo, contasPagas ?? []);
}
