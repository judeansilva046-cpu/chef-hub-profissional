"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { NumberField, PercentInput } from "@/components/ui/number-field";
import { Text } from "@/components/ui/text";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";

import {
  calcularCustoTotalItem,
  calcularPesoLiquidoItem,
} from "../calculations";
import type { FichaTecnicaItemFormState } from "../types";

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatoPeso = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

export interface FichaTecnicaItemRowProps {
  item: FichaTecnicaItemFormState;
  ingredientes: IngredienteParaSelecao[];
  onChange: (item: FichaTecnicaItemFormState) => void;
  onRemove: () => void;
  podeRemover: boolean;
}

export function FichaTecnicaItemRow({
  item,
  ingredientes,
  onChange,
  onRemove,
  podeRemover,
}: FichaTecnicaItemRowProps) {
  const ingrediente = ingredientes.find((i) => i.id === item.ingredienteId);
  const pesoBruto = item.pesoBruto ?? 0;

  const pesoLiquido = ingrediente
    ? calcularPesoLiquidoItem({
        pesoBruto,
        percentualPerda: item.percentualPerda,
        custoUnitario: ingrediente.custo_unitario_atual,
      })
    : 0;

  const custoTotalItem = ingrediente
    ? calcularCustoTotalItem({
        pesoBruto,
        percentualPerda: item.percentualPerda,
        custoUnitario: ingrediente.custo_unitario_atual,
      })
    : 0;

  return (
    <div className="border-border grid grid-cols-12 items-start gap-3 border-b py-3 last:border-0">
      <div className="col-span-4">
        <Combobox
          options={ingredientes.map((i) => ({
            value: i.id,
            label: i.nome,
            description: `${formatoMoeda.format(i.custo_unitario_atual)} / ${i.unidades_medida.sigla}`,
          }))}
          value={item.ingredienteId || null}
          onValueChange={(value) => onChange({ ...item, ingredienteId: value })}
          placeholder="Selecionar ingrediente..."
          searchPlaceholder="Buscar ingrediente..."
          emptyMessage="Nenhum ingrediente ativo encontrado."
        />
      </div>

      <div className="col-span-2">
        <NumberField
          value={item.pesoBruto}
          onChange={(value) => onChange({ ...item, pesoBruto: value })}
          min={0}
          placeholder={
            ingrediente ? `Peso (${ingrediente.unidades_medida.sigla})` : "Peso"
          }
        />
      </div>

      <div className="col-span-2">
        <PercentInput
          value={item.percentualPerda}
          onChange={(value) =>
            onChange({ ...item, percentualPerda: value ?? 0 })
          }
          min={0}
          max={99.99}
          placeholder="Perda %"
        />
      </div>

      <div className="col-span-2 flex h-10 items-center">
        <Text size="sm" tone="muted">
          {formatoPeso.format(pesoLiquido)} líquido
        </Text>
      </div>

      <div className="col-span-1 flex h-10 items-center">
        <Text size="sm" weight="medium">
          {formatoMoeda.format(custoTotalItem)}
        </Text>
      </div>

      <div className="col-span-1 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!podeRemover}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remover item</span>
        </Button>
      </div>
    </div>
  );
}
