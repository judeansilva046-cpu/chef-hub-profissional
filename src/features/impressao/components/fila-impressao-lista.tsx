"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarDataHora } from "@/lib/format";

import { cancelarTrabalhoImpressaoPendente, reimprimirTrabalho } from "../actions";

const TIPO_IMPRESSAO_LABEL: Record<string, string> = {
  etiqueta_validade: "Etiqueta de validade",
  comprovante_pedido: "Comprovante do pedido",
  comprovante_praca: "Comprovante de praça",
  comprovante_expedicao: "Comprovante de expedição",
  fechamento_caixa: "Fechamento de caixa",
};

const STATUS_IMPRESSAO_VARIANT: Record<string, "outline" | "info" | "success" | "danger"> = {
  pendente: "outline",
  processando: "info",
  concluido: "success",
  erro: "danger",
};

export interface FilaImpressaoListaProps {
  trabalhos: Tables<"fila_impressao">[];
  empresaId: string;
}

export function FilaImpressaoLista({ trabalhos, empresaId }: FilaImpressaoListaProps) {
  useRealtimeRefresh(["fila_impressao"], empresaId);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function rodar(acao: () => Promise<void>) {
    setErro(null);
    startTransition(async () => {
      try {
        await acao();
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      }
    });
  }

  if (trabalhos.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhum comprovante enfileirado ainda.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}
      {trabalhos.map((trabalho) => (
        <div key={trabalho.id} className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Printer className="text-muted-foreground h-4 w-4" />
            <Text size="sm">{TIPO_IMPRESSAO_LABEL[trabalho.tipo] ?? trabalho.tipo}</Text>
            <Badge variant={STATUS_IMPRESSAO_VARIANT[trabalho.status] ?? "outline"}>{trabalho.status}</Badge>
            <Text size="sm" tone="muted">
              {formatarDataHora(trabalho.criado_em)}
            </Text>
          </div>
          <div className="flex gap-1">
            {trabalho.status === "pendente" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => rodar(() => cancelarTrabalhoImpressaoPendente(trabalho.id))}
              >
                Cancelar
              </Button>
            )}
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => rodar(() => reimprimirTrabalho(trabalho.id))}>
              <RotateCw className="h-3 w-3" />
              Reimprimir
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
