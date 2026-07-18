"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

import type { FichaTecnicaParaFinanceiro } from "@/features/financeiro/queries";

import { VendaDialog } from "./venda-dialog";

export interface NovaVendaButtonProps {
  fichas: FichaTecnicaParaFinanceiro[];
  canais: Tables<"canais_venda">[];
  clientes: Tables<"clientes">[];
}

export function NovaVendaButton({ fichas, canais, clientes }: NovaVendaButtonProps) {
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
        Registrar venda
      </Button>
      <VendaDialog
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        fichas={fichas}
        canais={canais}
        clientes={clientes}
      />
    </>
  );
}
