"use client";

import { useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { estornarMovimentacaoCashback, resgatarCashback } from "../actions";

export function AcoesCashbackForm({ clienteId }: { clienteId: string }) {
  const [pending, startTransition] = useTransition();
  const resgatarRef = useRef<HTMLInputElement>(null);

  function resgatar() {
    const valor = Number(resgatarRef.current?.value);
    if (!valor || valor <= 0) return;
    startTransition(async () => {
      try {
        await resgatarCashback({ clienteId, valor, observacao: "Resgate manual" });
        if (resgatarRef.current) resgatarRef.current.value = "";
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível resgatar.");
      }
    });
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">Resgatar cashback (R$)</span>
        <Input ref={resgatarRef} type="number" step="0.01" min="0" className="w-32" />
      </div>
      <Button size="sm" variant="outline" disabled={pending} onClick={resgatar}>
        Resgatar
      </Button>
    </div>
  );
}

export function EstornarCashbackButton({ movimentacaoId, clienteId }: { movimentacaoId: string; clienteId: string }) {
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
            await estornarMovimentacaoCashback(movimentacaoId, clienteId);
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
