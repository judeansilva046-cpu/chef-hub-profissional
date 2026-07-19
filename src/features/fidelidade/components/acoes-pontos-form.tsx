"use client";

import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { concederPontosManual, estornarMovimentacaoFidelidade, resgatarPontos } from "../actions";

export function AcoesPontosForm({ clienteId }: { clienteId: string }) {
  const [pending, startTransition] = useTransition();
  const concederRef = useRef<HTMLInputElement>(null);
  const resgatarRef = useRef<HTMLInputElement>(null);

  function conceder() {
    const pontos = Number(concederRef.current?.value);
    if (!pontos || pontos <= 0) return;
    startTransition(async () => {
      try {
        await concederPontosManual({ clienteId, pontos, observacao: "Concessão manual" });
        if (concederRef.current) concederRef.current.value = "";
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível conceder pontos.");
      }
    });
  }

  function resgatar() {
    const pontos = Number(resgatarRef.current?.value);
    if (!pontos || pontos <= 0) return;
    startTransition(async () => {
      try {
        await resgatarPontos({ clienteId, pontos, observacao: "Resgate manual" });
        if (resgatarRef.current) resgatarRef.current.value = "";
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível resgatar pontos.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">Conceder pontos</span>
          <Input ref={concederRef} type="number" step="0.01" min="0" className="w-32" />
        </div>
        <Button size="sm" disabled={pending} onClick={conceder}>
          Conceder
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">Resgatar pontos</span>
          <Input ref={resgatarRef} type="number" step="0.01" min="0" className="w-32" />
        </div>
        <Button size="sm" variant="outline" disabled={pending} onClick={resgatar}>
          Resgatar
        </Button>
      </div>
    </div>
  );
}

export function EstornarMovimentacaoButton({
  movimentacaoId,
  clienteId,
}: {
  movimentacaoId: string;
  clienteId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Estornar esta movimentação?")) return;
        startTransition(async () => {
          try {
            await estornarMovimentacaoFidelidade(movimentacaoId, clienteId);
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "Não foi possível estornar.");
          }
        });
      }}
    >
      Estornar
    </Button>
  );
}
