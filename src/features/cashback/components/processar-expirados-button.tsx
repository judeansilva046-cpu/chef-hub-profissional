"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { processarCashbackExpirado } from "../actions";

export function ProcessarExpiradosButton() {
  const [pending, startTransition] = useTransition();

  function processar() {
    startTransition(async () => {
      try {
        const total = await processarCashbackExpirado();
        window.alert(
          total > 0
            ? `${total} lançamento(s) de cashback expirado processado(s).`
            : "Nenhum cashback vencido para expirar.",
        );
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível processar.");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={processar}>
      {pending ? "Processando..." : "Processar cashback expirado"}
    </Button>
  );
}
