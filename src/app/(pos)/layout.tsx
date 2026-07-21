import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { verifySession } from "@/server/auth/dal";
import {
  getEmpresaAtual,
  getPapelNaEmpresaAtual,
} from "@/server/auth/get-empresa-atual";
import {
  caminhoCasaDoPapel,
  podeAcessarRota,
} from "@/server/auth/permissoes-rota";

/**
 * Route group irmão de (app), fora do AppHeader — PDV e KDS precisam de
 * tela cheia/tablet-first, sem a navegação de back-office (que não cabe e
 * não faz sentido num terminal de caixa ou num painel de cozinha).
 * (app)/layout.tsx não tem opt-out para o AppHeader, então este é um layout
 * novo, não uma variação daquele.
 */
export default async function PosLayout({ children }: { children: ReactNode }) {
  await verifySession();

  const [empresaAtual, papel] = await Promise.all([
    getEmpresaAtual(),
    getPapelNaEmpresaAtual(),
  ]);
  if (!empresaAtual) {
    redirect("/onboarding");
  }

  const pathname = (await headers()).get("x-pathname") ?? "/pdv";
  if (papel && !podeAcessarRota(papel, pathname)) {
    redirect(caminhoCasaDoPapel(papel));
  }

  return (
    <div className="bg-background flex h-dvh flex-col overflow-hidden">
      <header className="border-border bg-background flex h-12 shrink-0 items-center justify-between border-b px-4">
        <Link
          href={papel ? caminhoCasaDoPapel(papel) : "/dashboard"}
          className="text-foreground text-sm font-semibold tracking-tight"
        >
          Chef Hub <span className="text-primary">Profissional</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {empresaAtual.nome}
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
