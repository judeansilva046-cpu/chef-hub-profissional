import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import {
  caminhoCasaDoPapel,
  type PapelEmpresa,
} from "@/server/auth/permissoes-rota";

export interface RoleGuardProps {
  allow: readonly PapelEmpresa[];
  children: ReactNode;
}

/**
 * Redireciona se o papel atual não estiver na lista — proteção de rota/página.
 */
export async function RoleGuard({ allow, children }: RoleGuardProps) {
  const papel = await getPapelNaEmpresaAtual();
  if (!papel || !allow.includes(papel)) {
    redirect(papel ? caminhoCasaDoPapel(papel) : "/login");
  }
  return <>{children}</>;
}
