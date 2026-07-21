import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

/**
 * Blocos de dados do dashboard — o loader só busca o que o papel pode ver.
 * Não é “esconder no CSS”: se o bloco não está na lista, a query não roda.
 */
export type DashboardBloco =
  | "financeiro_executivo"
  | "vendas_resumo"
  | "pedidos_operacao"
  | "estoque_critico"
  | "mesas"
  | "caixa_turno"
  | "cozinha_fila"
  | "expedicao"
  | "equipe_ativa"
  | "auditoria_recente"
  | "compras_pendentes"
  | "alertas_fichas"
  | "acoes_rapidas";

const BLOCOS_POR_PAPEL: Record<PapelEmpresa, readonly DashboardBloco[]> = {
  owner: [
    "financeiro_executivo",
    "vendas_resumo",
    "pedidos_operacao",
    "estoque_critico",
    "mesas",
    "caixa_turno",
    "cozinha_fila",
    "expedicao",
    "equipe_ativa",
    "auditoria_recente",
    "compras_pendentes",
    "alertas_fichas",
    "acoes_rapidas",
  ],
  gerente: [
    "vendas_resumo",
    "pedidos_operacao",
    "estoque_critico",
    "mesas",
    "cozinha_fila",
    "expedicao",
    "equipe_ativa",
    "auditoria_recente",
    "compras_pendentes",
    "alertas_fichas",
    "acoes_rapidas",
  ],
  financeiro: [
    "financeiro_executivo",
    "vendas_resumo",
    "acoes_rapidas",
  ],
  caixa: [
    "pedidos_operacao",
    "caixa_turno",
    "acoes_rapidas",
  ],
  cozinha: [
    "pedidos_operacao",
    "cozinha_fila",
    "expedicao",
    "acoes_rapidas",
  ],
  garcom: [
    "mesas",
    "pedidos_operacao",
    "cozinha_fila",
    "acoes_rapidas",
  ],
};

export function blocosDoPapel(papel: PapelEmpresa): readonly DashboardBloco[] {
  return BLOCOS_POR_PAPEL[papel];
}

export function papelPodeVerBloco(
  papel: PapelEmpresa,
  bloco: DashboardBloco,
): boolean {
  return BLOCOS_POR_PAPEL[papel].includes(bloco);
}

/** Permissões usadas por PermissionGate / testes. */
export type DashboardPermissao =
  | "ver_financeiro"
  | "ver_estoque"
  | "ver_equipe"
  | "ver_auditoria"
  | "ver_usuarios"
  | "ver_configuracoes"
  | "ver_mesas"
  | "ver_cozinha"
  | "ver_caixa";

const PERMISSOES_POR_PAPEL: Record<
  PapelEmpresa,
  readonly DashboardPermissao[]
> = {
  owner: [
    "ver_financeiro",
    "ver_estoque",
    "ver_equipe",
    "ver_auditoria",
    "ver_usuarios",
    "ver_configuracoes",
    "ver_mesas",
    "ver_cozinha",
    "ver_caixa",
  ],
  gerente: [
    "ver_financeiro",
    "ver_estoque",
    "ver_auditoria",
    "ver_usuarios",
    "ver_mesas",
    "ver_cozinha",
    "ver_caixa",
  ],
  financeiro: ["ver_financeiro"],
  caixa: ["ver_caixa"],
  cozinha: ["ver_cozinha"],
  garcom: ["ver_mesas", "ver_cozinha"],
};

export function papelTemPermissao(
  papel: PapelEmpresa,
  permissao: DashboardPermissao,
): boolean {
  return PERMISSOES_POR_PAPEL[papel].includes(permissao);
}

export function tituloDashboard(papel: PapelEmpresa): string {
  switch (papel) {
    case "owner":
      return "Dashboard do Owner";
    case "gerente":
      return "Dashboard do Gerente";
    case "financeiro":
      return "Dashboard Financeiro";
    case "caixa":
      return "Dashboard do Caixa";
    case "cozinha":
      return "Dashboard da Cozinha";
    case "garcom":
      return "Dashboard do Garçom";
  }
}
