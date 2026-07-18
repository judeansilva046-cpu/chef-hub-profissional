"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import { criarCentroCusto } from "../actions";

export interface CentroCustoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CentroCustoDialog({ open, onOpenChange }: CentroCustoDialogProps) {
  const [state, formAction, pending] = useActionState(criarCentroCusto, undefined);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo centro de custo</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" placeholder="Ex: BAR" required />
            {state?.fieldErrors?.codigo && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.codigo[0]}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Ex: Bar" required />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>
          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
