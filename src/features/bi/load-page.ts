import { redirect } from "next/navigation";

import {
  primeiroDiaDoMesAtual,
  ultimoDiaDoMesAtual,
} from "@/lib/periodo";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { caminhoCasaDoPapel } from "@/server/auth/permissoes-rota";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import { carregarBiDashboard } from "./queries";
import { papelPodeVerDashboard, podeLerBi } from "./permissions";
import type {
  BiComparativoModo,
  BiDashboardId,
  BiDrillLevel,
} from "./types";

function asComparativo(v: string | undefined): BiComparativoModo {
  if (
    v === "hoje_ontem" ||
    v === "semana_semana" ||
    v === "mes_mes" ||
    v === "ano_ano"
  ) {
    return v;
  }
  return "mes_mes";
}

function asDrill(v: string | undefined): BiDrillLevel {
  if (
    v === "empresa" ||
    v === "unidade" ||
    v === "categoria" ||
    v === "produto" ||
    v === "pedido"
  ) {
    return v;
  }
  return "unidade";
}

export async function loadBiPage(
  dashboard: BiDashboardId,
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (!papel || !podeLerBi(papel) || !papelPodeVerDashboard(papel, dashboard)) {
    redirect(papel ? caminhoCasaDoPapel(papel) : "/dashboard");
  }

  const sp = await searchParams;
  const dataInicio =
    (typeof sp.dataInicio === "string" && sp.dataInicio) ||
    primeiroDiaDoMesAtual();
  const dataFim =
    (typeof sp.dataFim === "string" && sp.dataFim) || ultimoDiaDoMesAtual();
  const comparativo = asComparativo(
    typeof sp.comparativo === "string" ? sp.comparativo : undefined,
  );
  const drill = asDrill(typeof sp.drill === "string" ? sp.drill : undefined);

  const data = await carregarBiDashboard({
    dashboard,
    dataInicio,
    dataFim,
    comparativo,
    drillLevel: drill,
    unidadeId: typeof sp.unidadeId === "string" ? sp.unidadeId : null,
    categoriaId: typeof sp.categoriaId === "string" ? sp.categoriaId : null,
    produtoId: typeof sp.produtoId === "string" ? sp.produtoId : null,
  });

  return {
    papel,
    data,
    search: {
      dataInicio,
      dataFim,
      comparativo,
      drill,
      unidadeId: typeof sp.unidadeId === "string" ? sp.unidadeId : undefined,
      categoriaId:
        typeof sp.categoriaId === "string" ? sp.categoriaId : undefined,
      produtoId: typeof sp.produtoId === "string" ? sp.produtoId : undefined,
    },
  };
}
