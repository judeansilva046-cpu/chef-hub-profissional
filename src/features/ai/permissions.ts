import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

/** Mesmo público do BI — dados sensíveis de gestão. */
export const PAPEIS_AI_LEITURA: readonly PapelEmpresa[] = [
  "owner",
  "gerente",
  "financeiro",
];

export function podeUsarChefHubAi(
  papel: PapelEmpresa | null | undefined,
): boolean {
  return Boolean(
    papel && (PAPEIS_AI_LEITURA as readonly string[]).includes(papel),
  );
}
