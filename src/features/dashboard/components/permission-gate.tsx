import type { ReactNode } from "react";

import {
  papelTemPermissao,
  type DashboardPermissao,
} from "@/features/dashboard/permissions";
import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

export interface PermissionGateProps {
  papel: PapelEmpresa;
  permissao: DashboardPermissao;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Não renderiza filhos sem permissão — uso em Server Components.
 * A fonte de verdade dos dados continua sendo o loader por papel
 * (não buscar o que o papel não pode ver).
 */
export function PermissionGate({
  papel,
  permissao,
  children,
  fallback = null,
}: PermissionGateProps) {
  if (!papelTemPermissao(papel, permissao)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
