import "server-only";

import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

/** Owner e gerente — painel de observabilidade /admin e APIs /api/admin/* */
export async function requireGestaoObservabilidade(): Promise<PapelEmpresa> {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (papel !== "owner" && papel !== "gerente") {
    throw new Error("Acesso restrito a Owner e Gerente.");
  }
  return papel;
}
