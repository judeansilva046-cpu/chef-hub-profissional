"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FornecedorDialog } from "./fornecedor-dialog";

export function NovoFornecedorButton() {
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
        Novo fornecedor
      </Button>
      <FornecedorDialog key={dialogKey} open={open} onOpenChange={setOpen} />
    </>
  );
}
