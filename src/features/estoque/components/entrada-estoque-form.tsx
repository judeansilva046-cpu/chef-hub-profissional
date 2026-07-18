"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";

import { registrarEntradaEstoque } from "../actions";

export interface EntradaEstoqueFormProps {
  ingredientes: IngredienteParaSelecao[];
  onSuccess: () => void;
}

export function EntradaEstoqueForm({
  ingredientes,
  onSuccess,
}: EntradaEstoqueFormProps) {
  const [state, formAction, pending] = useActionState(
    registrarEntradaEstoque,
    undefined,
  );
  const [ingredienteId, setIngredienteId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [custo, setCusto] = useState<number | null>(null);

  const ingredienteSelecionado = ingredientes.find(
    (item) => item.id === ingredienteId,
  );

  useEffect(() => {
    if (state?.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="entrada-ingredienteId">Ingrediente</Label>
        <Combobox
          name="ingredienteId"
          value={ingredienteId}
          onValueChange={(value) => {
            setIngredienteId(value);
            const ingrediente = ingredientes.find((item) => item.id === value);
            if (ingrediente) setCusto(ingrediente.custo_unitario_atual);
          }}
          options={ingredientes.map((item) => ({
            value: item.id,
            label: item.nome,
            description: item.unidades_medida.sigla,
          }))}
          placeholder="Selecionar ingrediente..."
        />
        {state?.fieldErrors?.ingredienteId && (
          <Text size="sm" tone="danger">
            {state.fieldErrors.ingredienteId[0]}
          </Text>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entrada-quantidade">
            Quantidade
            {ingredienteSelecionado
              ? ` (${ingredienteSelecionado.unidades_medida.sigla})`
              : ""}
          </Label>
          <NumberField
            id="entrada-quantidade"
            name="quantidade"
            value={quantidade}
            onChange={setQuantidade}
            min={0}
            placeholder="0"
          />
          {state?.fieldErrors?.quantidade && (
            <Text size="sm" tone="danger">
              {state.fieldErrors.quantidade[0]}
            </Text>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entrada-custoUnitario">Custo unitário</Label>
          <CurrencyInput
            id="entrada-custoUnitario"
            name="custoUnitario"
            value={custo}
            onChange={setCusto}
            min={0}
            placeholder="R$ 0,00"
          />
          {state?.fieldErrors?.custoUnitario && (
            <Text size="sm" tone="danger">
              {state.fieldErrors.custoUnitario[0]}
            </Text>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entrada-numeroLote">Nº do lote (opcional)</Label>
          <Input
            id="entrada-numeroLote"
            name="numeroLote"
            placeholder="Ex: L2026-001"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entrada-dataValidade">Validade (opcional)</Label>
          <Input id="entrada-dataValidade" name="dataValidade" type="date" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="entrada-observacao">Observação (opcional)</Label>
        <Textarea
          id="entrada-observacao"
          name="observacao"
          rows={2}
          placeholder="Ex: Compra do fornecedor X"
        />
      </div>

      {state?.formError && (
        <Text size="sm" tone="danger">
          {state.formError}
        </Text>
      )}

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? "Registrando..." : "Registrar entrada"}
      </Button>
    </form>
  );
}
