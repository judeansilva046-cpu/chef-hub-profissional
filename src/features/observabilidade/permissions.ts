import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

/** Painel /admin e APIs /api/admin/* — owner e gerente da empresa ativa. */
export function podeVerObservabilidade(papel: PapelEmpresa | null): boolean {
  return papel === "owner" || papel === "gerente";
}

/**
 * Garante isolamento por empresa em listas de auditoria/logs (defesa em
 * profundidade além do RLS).
 */
export function filtrarPorEmpresaId<T extends { empresa_id: string | null }>(
  rows: readonly T[],
  empresaId: string,
): T[] {
  return rows.filter((row) => row.empresa_id === empresaId);
}

export function assertSemVazamentoEntreEmpresas<
  T extends { empresa_id: string | null },
>(rows: readonly T[], empresaId: string): boolean {
  return rows.every((row) => row.empresa_id === empresaId);
}
