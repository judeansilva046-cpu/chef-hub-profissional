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
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarUnidadeMedida, criarUnidadeMedida } from "../actions";
import { TIPOS_GRANDEZA } from "../types";

export interface UnidadeMedidaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edição; ausente = criação. */
  unidade?: Tables<"unidades_medida">;
}

export function UnidadeMedidaDialog({
  open,
  onOpenChange,
  unidade,
}: UnidadeMedidaDialogProps) {
  const action = unidade
    ? atualizarUnidadeMedida.bind(null, unidade.id)
    : criarUnidadeMedida;
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
            {unidade ? "Editar unidade de medida" : "Nova unidade de medida"}
          </DialogTitle>
          <DialogDescription>
            Disponível apenas para a empresa ativa.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Quilograma"
              defaultValue={unidade?.nome}
              required
            />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sigla">Sigla</Label>
            <Input
              id="sigla"
              name="sigla"
              placeholder="Ex: kg"
              defaultValue={unidade?.sigla}
              required
            />
            {state?.fieldErrors?.sigla && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.sigla[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipoGrandeza">Grandeza</Label>
            <Select
              id="tipoGrandeza"
              name="tipoGrandeza"
              defaultValue={unidade?.tipo_grandeza ?? "unidade"}
              required
            >
              {TIPOS_GRANDEZA.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </Select>
            {state?.fieldErrors?.tipoGrandeza && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.tipoGrandeza[0]}
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
