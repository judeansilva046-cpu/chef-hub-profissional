import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

/** Papéis que podem gerir campanhas, segmentos e regras de fidelidade. */
export const PAPEIS_CRM_GESTAO: readonly PapelEmpresa[] = ["owner", "gerente"];

/** Papéis que podem operar pontos/cupons no dia a dia. */
export const PAPEIS_CRM_OPERACAO: readonly PapelEmpresa[] = [
  "owner",
  "gerente",
  "caixa",
  "garcom",
];

/** Papéis com leitura do dashboard CRM. */
export const PAPEIS_CRM_LEITURA: readonly PapelEmpresa[] = [
  "owner",
  "gerente",
  "financeiro",
  "caixa",
  "garcom",
];

export function podeGerirCrm(papel: PapelEmpresa | null | undefined): boolean {
  return Boolean(papel && (PAPEIS_CRM_GESTAO as readonly string[]).includes(papel));
}

export function podeOperarCrm(papel: PapelEmpresa | null | undefined): boolean {
  return Boolean(papel && (PAPEIS_CRM_OPERACAO as readonly string[]).includes(papel));
}

export function podeLerCrm(papel: PapelEmpresa | null | undefined): boolean {
  return Boolean(papel && (PAPEIS_CRM_LEITURA as readonly string[]).includes(papel));
}
