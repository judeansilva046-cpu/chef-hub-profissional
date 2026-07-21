import "server-only";

import {
  getPapelNaEmpresaAtual,
  type PapelEmpresa,
} from "./get-empresa-atual";
import { requireEmpresaAtual } from "./require-empresa";

/**
 * Garante que o papel do usuário na empresa ativa está entre os permitidos.
 * `owner` e `gerente` sempre passam (gestão plena, alinhado às rotas `*`).
 */
export async function requirePapel(
  ...papeisPermitidos: PapelEmpresa[]
): Promise<PapelEmpresa> {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();

  if (!papel) {
    throw new Error("Sem papel na empresa ativa.");
  }

  if (papel === "owner" || papel === "gerente") {
    return papel;
  }

  if (!papeisPermitidos.includes(papel)) {
    throw new Error("Você não tem permissão para esta ação.");
  }

  return papel;
}
