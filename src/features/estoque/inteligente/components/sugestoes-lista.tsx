"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";
import { atualizarStatusSugestao } from "../actions";
import type { SugestaoCompraComNome } from "../queries";

export function SugestoesLista({
  sugestoes,
}: {
  sugestoes: SugestaoCompraComNome[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function mudar(id: string, status: "aceita" | "rejeitada" | "comprada") {
    startTransition(async () => {
      await atualizarStatusSugestao(id, status);
      router.refresh();
    });
  }

  if (sugestoes.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhuma sugestão aberta. Gere pelo dashboard inteligente.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sugestoes.map((s) => (
        <div key={s.id} className="border-border bg-card flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Text weight="medium">{s.ingredientes?.nome ?? "Ingrediente"}</Text>
            <Badge
              variant={
                s.priority === "critica" || s.priority === "alta" ? "danger" : "outline"
              }
            >
              {s.priority}
            </Badge>
          </div>
          <Text size="sm" tone="muted">
            Qtd {s.suggested_qty}
            {s.unit_price != null ? ` · ${formatarMoeda(s.unit_price)}` : ""}
            {s.buy_by ? ` · comprar até ${s.buy_by}` : ""}
          </Text>
          <Text size="sm">{s.reason}</Text>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending} onClick={() => mudar(s.id, "aceita")}>
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => mudar(s.id, "comprada")}
            >
              Comprada
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => mudar(s.id, "rejeitada")}
            >
              Rejeitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
