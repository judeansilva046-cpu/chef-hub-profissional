"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarPrecoFornecedor } from "../actions";

export interface PrecoFornecedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredienteId: string;
  ingredienteNome: string;
  fornecedores: Tables<"fornecedores">[];
  registro?: { fornecedorId: string; precoUnitario: number };
}

export function PrecoFornecedorDialog({
  open,
  onOpenChange,
  ingredienteId,
  ingredienteNome,
  fornecedores,
  registro,
}: PrecoFornecedorDialogProps) {
  const [state, formAction, pending] = useActionState(
    salvarPrecoFornecedor,
    undefined,
  );
  const [preco, setPreco] = useState<number | null>(
    registro?.precoUnitario ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preço de {ingredienteNome}</DialogTitle>
          <DialogDescription>
            Usado no comparativo de preços e como sugestão automática na
            lista inteligente de compras.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="ingredienteId" value={ingredienteId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fornecedorId">Fornecedor</Label>
            <Select
              id="fornecedorId"
              name="fornecedorId"
              defaultValue={registro?.fornecedorId ?? ""}
              required
            >
              <option value="" disabled>
                Selecionar...
              </option>
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </Select>
            {state?.fieldErrors?.fornecedorId && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.fornecedorId[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="precoUnitario">Preço unitário</Label>
            <CurrencyInput
              name="precoUnitario"
              value={preco}
              onChange={setPreco}
              min={0}
              placeholder="R$ 0,00"
            />
            {state?.fieldErrors?.precoUnitario && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.precoUnitario[0]}
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
