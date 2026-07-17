"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

import {
  atualizarCategoriaIngrediente,
  criarCategoriaIngrediente,
} from "../actions";

export interface CategoriaIngredienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: Tables<"categorias_ingredientes">;
}

export function CategoriaIngredienteDialog({
  open,
  onOpenChange,
  categoria,
}: CategoriaIngredienteDialogProps) {
  const action = categoria
    ? atualizarCategoriaIngrediente.bind(null, categoria.id)
    : criarCategoriaIngrediente;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {categoria ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            Organiza os ingredientes em grupos (ex: laticínios, carnes, secos).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Laticínios"
              defaultValue={categoria?.nome}
              required
            />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              name="descricao"
              rows={3}
              defaultValue={categoria?.descricao ?? ""}
            />
            {state?.fieldErrors?.descricao && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.descricao[0]}
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
