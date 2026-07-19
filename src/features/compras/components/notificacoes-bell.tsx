"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { marcarNotificacaoLida, marcarTodasNotificacoesLidas } from "../actions";

const REFERENCIA_HREF: Record<string, (id: string) => string> = {
  solicitacao_compra: (id) => `/compras/solicitacoes/${id}`,
  pedido_compra: (id) => `/compras/pedidos/${id}`,
};

export interface NotificacoesBellProps {
  notificacoes: Tables<"compras_notificacoes">[];
  naoLidas: number;
}

export function NotificacoesBell({ notificacoes, naoLidas }: NotificacoesBellProps) {
  const [aberto, setAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function abrirNotificacao(id: string) {
    startTransition(() => marcarNotificacaoLida(id));
  }

  function marcarTodas() {
    startTransition(() => marcarTodasNotificacoesLidas());
  }

  return (
    <div ref={containerRef} className="relative">
      <Button variant="ghost" size="sm" onClick={() => setAberto((atual) => !atual)}>
        <Bell className="h-4 w-4" />
        {naoLidas > 0 && (
          <Badge variant="danger" className="ml-1">
            {naoLidas}
          </Badge>
        )}
      </Button>

      {aberto && (
        <div className="bg-card border-border absolute right-0 z-50 mt-2 w-80 rounded-lg border p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <Text size="sm" weight="semibold">
              Notificações
            </Text>
            {naoLidas > 0 && (
              <Button variant="ghost" size="sm" disabled={pending} onClick={marcarTodas}>
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <EmptyState title="Nenhuma notificação" />
          ) : (
            <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
              {notificacoes.map((notificacao) => {
                const href =
                  notificacao.referencia_tipo && notificacao.referencia_id
                    ? REFERENCIA_HREF[notificacao.referencia_tipo]?.(notificacao.referencia_id)
                    : undefined;
                const conteudo = (
                  <div
                    className={`flex flex-col gap-0.5 rounded-md p-2 text-sm ${
                      notificacao.lida ? "" : "bg-secondary/40"
                    }`}
                  >
                    <Text size="sm">{notificacao.mensagem}</Text>
                    <Text size="sm" tone="muted">
                      {formatarDataHora(notificacao.criado_em)}
                    </Text>
                  </div>
                );

                return (
                  <li key={notificacao.id}>
                    {href ? (
                      <Link href={href} onClick={() => abrirNotificacao(notificacao.id)}>
                        {conteudo}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => abrirNotificacao(notificacao.id)}
                      >
                        {conteudo}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
