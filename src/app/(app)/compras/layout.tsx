import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { NotificacoesBell } from "@/features/compras/components/notificacoes-bell";
import {
  contarNotificacoesNaoLidasCompras,
  listarNotificacoesCompras,
} from "@/features/compras/queries";

export default async function ComprasLayout({ children }: { children: ReactNode }) {
  const [notificacoes, naoLidas] = await Promise.all([
    listarNotificacoesCompras(),
    contarNotificacoesNaoLidasCompras(),
  ]);

  return (
    <div className="flex flex-col">
      <div className="border-border border-b">
        <Container className="flex justify-end py-2">
          <NotificacoesBell notificacoes={notificacoes} naoLidas={naoLidas} />
        </Container>
      </div>
      {children}
    </div>
  );
}
