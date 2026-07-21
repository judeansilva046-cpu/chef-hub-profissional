import "server-only";

import type { Tables } from "@/lib/supabase/database.types";

import { getEmpresaAtual } from "./get-empresa-atual";

/**
 * Garante empresa ativa na Server Action. Preferir sobre getEmpresaAtual()
 * + if (!empresa) em mutations — falha alto em vez de seguir com id solto.
 */
export async function requireEmpresaAtual(): Promise<Tables<"empresas">> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }
  return empresa;
}
