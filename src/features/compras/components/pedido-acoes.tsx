"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Send, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { aprovarPedidoCompra, atualizarStatusPedido } from "../actions";

export interface PedidoAcoesProps {
  pedidoId: string;
  status: string;
}

export function PedidoAcoes({ pedidoId, status }: PedidoAcoesProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alterarStatus(novoStatus: "aguardando_aprovacao" | "enviado" | "cancelado") {
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarStatusPedido(pedidoId, novoStatus);
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o pedido.",
        );
      }
    });
  }

  function aprovar() {
    setErro(null);
    startTransition(async () => {
      try {
        await aprovarPedidoCompra(pedidoId);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível aprovar o pedido.");
      }
    });
  }

  const podeAlterar = ["rascunho", "aguardando_aprovacao", "aprovado", "enviado"].includes(status);

  if (!podeAlterar) {
    return (
      <a href={`/api/compras/pedidos/${pedidoId}/pdf`} className="text-primary flex items-center gap-1.5 text-sm hover:underline">
        <Download className="h-4 w-4" />
        Baixar PDF
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a href={`/api/compras/pedidos/${pedidoId}/pdf`} className="text-primary flex items-center gap-1.5 text-sm hover:underline">
          <Download className="h-4 w-4" />
          PDF
        </a>
        {status === "rascunho" && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => alterarStatus("aguardando_aprovacao")}
          >
            <ShieldCheck className="h-4 w-4" />
            Solicitar aprovação
          </Button>
        )}
        {status === "aguardando_aprovacao" && (
          <Button size="sm" disabled={pending} onClick={aprovar}>
            <Check className="h-4 w-4" />
            Aprovar
          </Button>
        )}
        {(status === "rascunho" || status === "aprovado") && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => alterarStatus("enviado")}
          >
            <Send className="h-4 w-4" />
            Marcar como enviado
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => alterarStatus("cancelado")}
        >
          <X className="h-4 w-4" />
          Cancelar pedido
        </Button>
      </div>
      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}
    </div>
  );
}
