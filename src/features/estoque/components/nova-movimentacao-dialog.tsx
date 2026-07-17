"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";

import { AjusteEstoqueForm } from "./ajuste-estoque-form";
import { EntradaEstoqueForm } from "./entrada-estoque-form";
import { SaidaEstoqueForm } from "./saida-estoque-form";

export interface NovaMovimentacaoDialogProps {
  ingredientes: IngredienteParaSelecao[];
}

export function NovaMovimentacaoDialog({
  ingredientes,
}: NovaMovimentacaoDialogProps) {
  const [open, setOpen] = useState(false);
  // Remonta os três formulários a cada abertura, garantindo estado limpo.
  const [dialogKey, setDialogKey] = useState(0);

  function abrir() {
    setOpen(true);
    setDialogKey((key) => key + 1);
  }

  return (
    <>
      <Button size="sm" onClick={abrir}>
        <Plus className="h-4 w-4" />
        Nova movimentação
      </Button>

      <Dialog key={dialogKey} open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova movimentação de estoque</DialogTitle>
            <DialogDescription>
              Entradas criam um novo lote (consumido por ordem FIFO); saídas
              consomem os lotes mais antigos primeiro; ajustes corrigem
              divergências pontuais.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="entrada">
            <TabsList>
              <TabsTrigger value="entrada">Entrada</TabsTrigger>
              <TabsTrigger value="saida">Saída</TabsTrigger>
              <TabsTrigger value="ajuste">Ajuste</TabsTrigger>
            </TabsList>
            <TabsContent value="entrada">
              <EntradaEstoqueForm
                ingredientes={ingredientes}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>
            <TabsContent value="saida">
              <SaidaEstoqueForm
                ingredientes={ingredientes}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>
            <TabsContent value="ajuste">
              <AjusteEstoqueForm
                ingredientes={ingredientes}
                onSuccess={() => setOpen(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
