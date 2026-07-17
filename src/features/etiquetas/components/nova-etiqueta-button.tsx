"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { LoteParaEtiqueta } from "../queries";
import { EmitirEtiquetaDialog } from "./emitir-etiqueta-dialog";

export interface NovaEtiquetaButtonProps {
  lotes: LoteParaEtiqueta[];
}

export function NovaEtiquetaButton({ lotes }: NovaEtiquetaButtonProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
          setDialogKey((key) => key + 1);
        }}
      >
        <Plus className="h-4 w-4" />
        Emitir etiqueta
      </Button>
      <EmitirEtiquetaDialog key={dialogKey} open={open} onOpenChange={setOpen} lotes={lotes} />
    </>
  );
}
