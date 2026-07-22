import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { verifySession } from "@/server/auth/dal";
import {
  getEmpresaAtual,
  getEmpresasDoUsuario,
  getPapelNaEmpresaAtual,
} from "@/server/auth/get-empresa-atual";
import {
  caminhoCasaDoPapel,
  podeAcessarRota,
} from "@/server/auth/permissoes-rota";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await verifySession();

  const [empresas, empresaAtual, papel] = await Promise.all([
    getEmpresasDoUsuario(),
    getEmpresaAtual(),
    getPapelNaEmpresaAtual(),
  ]);

  if (!empresaAtual) {
    redirect("/onboarding");
  }

  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
  if (papel && !podeAcessarRota(papel, pathname)) {
    redirect(caminhoCasaDoPapel(papel));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        empresas={empresas}
        empresaAtualId={empresaAtual.id}
        papel={papel}
      />
      <main className="bg-secondary/20 flex-1">{children}</main>
    </div>
  );
}
