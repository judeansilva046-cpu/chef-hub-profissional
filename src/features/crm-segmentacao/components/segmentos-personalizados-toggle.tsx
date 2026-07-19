"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { alternarAtivoSegmentoPersonalizado, excluirSegmentoPersonalizado } from "../actions";

export function SegmentoPersonalizadoAcoes({ id, ativo }: { id: string; ativo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => alternarAtivoSegmentoPersonalizado(id, !ativo))}
      >
        {ativo ? "Desativar" : "Ativar"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Excluir este segmento personalizado?")) {
            startTransition(() => excluirSegmentoPersonalizado(id));
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Excluir</span>
      </Button>
    </div>
  );
}
