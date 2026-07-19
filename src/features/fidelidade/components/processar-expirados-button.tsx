"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { processarPontosExpirados } from "../actions";

export function ProcessarExpiradosButton() {
  const [pending, startTransition] = useTransition();

  function processar() {
    startTransition(async () => {
      try {
        const total = await processarPontosExpirados();
        window.alert(
          total > 0
            ? `${total} lançamento(s) de pontos expirados processado(s).`
            : "Nenhum ponto vencido para expirar.",
        );
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível processar.");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={processar}>
      {pending ? "Processando..." : "Processar pontos expirados"}
    </Button>
  );
}
