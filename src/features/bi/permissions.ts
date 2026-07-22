import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

import type { BiDashboardId } from "./types";

/** Leitura do BI executivo — owner, gerente e financeiro. */
export const PAPEIS_BI_LEITURA: readonly PapelEmpresa[] = [
  "owner",
  "gerente",
  "financeiro",
];

/** Cadastro/edição de metas BI. */
export const PAPEIS_BI_METAS: readonly PapelEmpresa[] = [
  "owner",
  "gerente",
  "financeiro",
];

export function podeLerBi(papel: PapelEmpresa | null | undefined): boolean {
  return Boolean(papel && (PAPEIS_BI_LEITURA as readonly string[]).includes(papel));
}

export function podeGerirMetasBi(papel: PapelEmpresa | null | undefined): boolean {
  return Boolean(papel && (PAPEIS_BI_METAS as readonly string[]).includes(papel));
}

/** Dashboards visíveis por papel (financeiro não vê KDS/funcionários operacionais). */
export function dashboardsDoPapel(papel: PapelEmpresa): BiDashboardId[] {
  const base: BiDashboardId[] = [
    "visao_geral",
    "financeiro",
    "vendas",
    "crm",
    "metas",
  ];
  if (papel === "financeiro") {
    return [...base, "estoque", "delivery"];
  }
  return [
    ...base,
    "delivery",
    "salao",
    "estoque",
    "kds",
    "funcionarios",
  ];
}

export function papelPodeVerDashboard(
  papel: PapelEmpresa | null | undefined,
  id: BiDashboardId,
): boolean {
  if (!papel || !podeLerBi(papel)) return false;
  return dashboardsDoPapel(papel).includes(id);
}
