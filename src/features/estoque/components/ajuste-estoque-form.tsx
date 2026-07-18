"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";

import { registrarAjusteEstoque } from "../actions";

export interface AjusteEstoqueFormProps {
  ingredientes: IngredienteParaSelecao[];
  onSuccess: () => void;
}

export function AjusteEstoqueForm({
  ingredientes,
  onSuccess,
}: AjusteEstoqueFormProps) {
  const [state, formAction, pending] = useActionState(
    registrarAjusteEstoque,
    undefined,
  );
  const [ingredienteId, setIngredienteId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number | null>(null);

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
        <Label htmlFor="ajuste-ingredienteId">Ingrediente</Label>
        <Combobox
          name="ingredienteId"
          value={ingredienteId}
          onValueChange={setIngredienteId}
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
          <Label htmlFor="ajuste-direcao">Sentido do ajuste</Label>
          <Select id="ajuste-direcao" name="direcao" defaultValue="entrada">
            <option value="entrada">Adicionar ao estoque</option>
            <option value="saida">Remover do estoque</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ajuste-quantidade">
            Quantidade
            {ingredienteSelecionado
              ? ` (${ingredienteSelecionado.unidades_medida.sigla})`
              : ""}
          </Label>
          <NumberField
            id="ajuste-quantidade"
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ajuste-observacao">Motivo do ajuste</Label>
        <Textarea
          id="ajuste-observacao"
          name="observacao"
          rows={2}
          placeholder="Ex: Divergência encontrada na conferência de estoque"
        />
        {state?.fieldErrors?.observacao && (
          <Text size="sm" tone="danger">
            {state.fieldErrors.observacao[0]}
          </Text>
        )}
      </div>

      {state?.formError && (
        <Text size="sm" tone="danger">
          {state.formError}
        </Text>
      )}

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? "Registrando..." : "Registrar ajuste"}
      </Button>
    </form>
  );
}
