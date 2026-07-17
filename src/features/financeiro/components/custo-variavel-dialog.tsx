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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarCustoVariavel, criarCustoVariavel } from "../actions";

export interface CustoVariavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custoVariavel?: Tables<"custos_variaveis">;
}

export function CustoVariavelDialog({
  open,
  onOpenChange,
  custoVariavel,
}: CustoVariavelDialogProps) {
  const action = custoVariavel
    ? atualizarCustoVariavel.bind(null, custoVariavel.id)
    : criarCustoVariavel;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [tipo, setTipo] = useState(
    custoVariavel?.tipo ?? "percentual_sobre_venda",
  );
  const [valor, setValor] = useState<number | null>(
    () => custoVariavel?.valor ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {custoVariavel ? "Editar custo variável" : "Novo custo variável"}
          </DialogTitle>
          <DialogDescription>
            Custos que só existem quando há uma venda: taxa de cartão,
            comissão de marketplace, embalagem. Usados para calcular a margem
            de contribuição real de cada ficha técnica.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Taxa de cartão, Comissão iFood, Embalagem"
              defaultValue={custoVariavel?.nome}
              required
            />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              id="tipo"
              name="tipo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
            >
              <option value="percentual_sobre_venda">
                Percentual sobre o preço de venda
              </option>
              <option value="valor_fixo_por_venda">
                Valor fixo por venda
              </option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valor">
              {tipo === "percentual_sobre_venda"
                ? "Percentual (%)"
                : "Valor por venda (R$)"}
            </Label>
            <NumberField
              name="valor"
              kind={tipo === "percentual_sobre_venda" ? "percent" : "currency"}
              value={valor}
              onChange={setValor}
              min={0}
              max={tipo === "percentual_sobre_venda" ? 100 : undefined}
              placeholder={tipo === "percentual_sobre_venda" ? "0%" : "R$ 0,00"}
            />
            {state?.fieldErrors?.valor && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.valor[0]}
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
