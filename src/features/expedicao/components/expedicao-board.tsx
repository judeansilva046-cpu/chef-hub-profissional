"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { TIPO_PEDIDO_LABEL } from "@/features/pedidos/status";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarMoeda } from "@/lib/format";

import { avancarStatusExpedicao } from "../actions";
import type { ExpedicaoComPedido } from "../queries";

const STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  conferido: "Conferido",
  embalado: "Embalado",
  saiu: "Saiu para entrega",
  entregue: "Entregue",
};

const PROXIMA_ACAO_LABEL: Record<string, string> = {
  aguardando: "Conferir",
  conferido: "Embalar",
  embalado: "Saiu para entrega",
  saiu: "Marcar entregue",
};

export interface ExpedicaoBoardProps {
  expedicoes: ExpedicaoComPedido[];
  entregadores: Tables<"entregadores">[];
  empresaId: string;
}

export function ExpedicaoBoard({ expedicoes, entregadores, empresaId }: ExpedicaoBoardProps) {
  useRealtimeRefresh(["expedicoes", "pedidos"], empresaId);

  if (expedicoes.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhum pedido aguardando expedição.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {expedicoes.map((expedicao) => (
        <ExpedicaoCard key={expedicao.id} expedicao={expedicao} entregadores={entregadores} />
      ))}
    </div>
  );
}

function ExpedicaoCard({
  expedicao,
  entregadores,
}: {
  expedicao: ExpedicaoComPedido;
  entregadores: Tables<"entregadores">[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [entregadorId, setEntregadorId] = useState("");

  function avancar() {
    setErro(null);
    startTransition(async () => {
      try {
        await avancarStatusExpedicao(expedicao.id, expedicao.status, {
          entregadorId: entregadorId || undefined,
        });
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível avançar.");
      }
    });
  }

  const precisaEntregador = expedicao.status === "embalado" && expedicao.pedidos.tipo === "entrega";

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <div className="flex items-center gap-2">
          <Text weight="medium">Pedido #{expedicao.pedidos.numero}</Text>
          <Badge variant="outline">{TIPO_PEDIDO_LABEL[expedicao.pedidos.tipo] ?? expedicao.pedidos.tipo}</Badge>
          <Badge variant="info">{STATUS_LABEL[expedicao.status] ?? expedicao.status}</Badge>
        </div>
        <Text size="sm" tone="muted">
          {expedicao.pedidos.clientes?.nome ?? "Sem cliente"} · {formatarMoeda(expedicao.pedidos.total)}
          {expedicao.entregadores && ` · ${expedicao.entregadores.nome}`}
        </Text>
        {erro && (
          <Text size="sm" tone="danger">
            {erro}
          </Text>
        )}
      </div>

      <div className="flex items-center gap-2">
        {precisaEntregador && (
          <Select className="w-40" value={entregadorId} onChange={(event) => setEntregadorId(event.target.value)}>
            <option value="">Entregador...</option>
            {entregadores.map((entregador) => (
              <option key={entregador.id} value={entregador.id}>
                {entregador.nome}
              </option>
            ))}
          </Select>
        )}
        <Button size="sm" disabled={pending} onClick={avancar}>
          {PROXIMA_ACAO_LABEL[expedicao.status] ?? "Avançar"}
        </Button>
      </div>
    </div>
  );
}
