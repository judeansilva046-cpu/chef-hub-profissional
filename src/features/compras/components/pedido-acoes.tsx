"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { atualizarStatusPedido } from "../actions";

export interface PedidoAcoesProps {
  pedidoId: string;
  status: string;
}

export function PedidoAcoes({ pedidoId, status }: PedidoAcoesProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function alterarStatus(novoStatus: "enviado" | "cancelado") {
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

  if (status !== "rascunho" && status !== "enviado") {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === "rascunho" && (
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
