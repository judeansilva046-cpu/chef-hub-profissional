"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { repetirSemanaAnterior } from "../actions";

export interface RepetirSemanaButtonProps {
  dataInicioSemanaAtual: string;
}

export function RepetirSemanaButton({
  dataInicioSemanaAtual,
}: RepetirSemanaButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);

  function repetir() {
    setMensagem(null);
    startTransition(async () => {
      try {
        const quantidade = await repetirSemanaAnterior(dataInicioSemanaAtual);
        setMensagem(
          quantidade === 0
            ? "Nenhuma produção encontrada na semana anterior."
            : `${quantidade} produção(ões) copiada(s) da semana anterior.`,
        );
        router.refresh();
      } catch (error) {
        setMensagem(
          error instanceof Error
            ? error.message
            : "Não foi possível repetir a semana anterior.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={repetir}
      >
        <Repeat className="h-4 w-4" />
        {pending ? "Repetindo..." : "Repetir semana anterior"}
      </Button>
      {mensagem && (
        <Text size="sm" tone="muted">
          {mensagem}
        </Text>
      )}
    </div>
  );
}
