import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { verifySession } from "@/server/auth/dal";
import {
  getEmpresaAtual,
  getEmpresasDoUsuario,
} from "@/server/auth/get-empresa-atual";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await verifySession();

  const [empresas, empresaAtual] = await Promise.all([
    getEmpresasDoUsuario(),
    getEmpresaAtual(),
  ]);

  if (!empresaAtual) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader empresas={empresas} empresaAtualId={empresaAtual.id} />
      <main className="bg-secondary/20 flex-1">{children}</main>
    </div>
  );
}
