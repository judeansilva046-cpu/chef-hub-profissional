"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

import { IngredienteDialog } from "./ingrediente-dialog";

export interface NovoIngredienteButtonProps {
  categorias: Tables<"categorias_ingredientes">[];
  unidades: Tables<"unidades_medida">[];
}

export function NovoIngredienteButton({
  categorias,
  unidades,
}: NovoIngredienteButtonProps) {
  const [open, setOpen] = useState(false);
  // Incrementado a cada clique para remontar o IngredienteDialog — garante
  // que o formulário comece limpo mesmo após um cancelamento anterior.
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
        Novo ingrediente
      </Button>
      <IngredienteDialog
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        categorias={categorias}
        unidades={unidades}
      />
    </>
  );
}
