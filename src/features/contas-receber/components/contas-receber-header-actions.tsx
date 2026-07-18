"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/database.types";

import { NovaContaReceberDialog } from "./nova-conta-receber-dialog";

export interface ContasReceberHeaderActionsProps {
  clientes: Tables<"clientes">[];
  planoContas: Tables<"plano_contas">[];
  centrosCusto: Tables<"centros_custo">[];
}

export function ContasReceberHeaderActions({ clientes, planoContas, centrosCusto }: ContasReceberHeaderActionsProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setDialogAberto(true);
          setDialogKey((key) => key + 1);
        }}
      >
        <Plus className="h-4 w-4" />
        Nova conta
      </Button>

      <NovaContaReceberDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        clientes={clientes}
        planoContas={planoContas}
        centrosCusto={centrosCusto}
      />
    </>
  );
}
