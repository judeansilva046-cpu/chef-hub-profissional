"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Text } from "@/components/ui/text";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";
import { formatarMoeda } from "@/lib/format";

import type { PedidoItemFormState } from "../types";

export interface PedidoItemRowProps {
  item: PedidoItemFormState;
  ingredientes: IngredienteParaSelecao[];
  onChange: (item: PedidoItemFormState) => void;
  onRemove: () => void;
  podeRemover: boolean;
}

export function PedidoItemRow({
  item,
  ingredientes,
  onChange,
  onRemove,
  podeRemover,
}: PedidoItemRowProps) {
  const ingrediente = ingredientes.find((i) => i.id === item.ingredienteId);
  const valorTotal = (item.quantidade ?? 0) * (item.precoUnitario ?? 0);

  return (
    <div className="border-border grid grid-cols-12 items-center gap-3 border-b py-3 last:border-0">
      <div className="col-span-5">
        <Combobox
          options={ingredientes.map((i) => ({
            value: i.id,
            label: i.nome,
            description: i.unidades_medida.sigla,
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
          value={item.quantidade}
          onChange={(value) => onChange({ ...item, quantidade: value })}
          min={0}
          placeholder={ingrediente ? ingrediente.unidades_medida.sigla : "Qtd."}
        />
      </div>

      <div className="col-span-2">
        <CurrencyInput
          value={item.precoUnitario}
          onChange={(value) => onChange({ ...item, precoUnitario: value })}
          min={0}
          placeholder="R$ 0,00"
        />
      </div>

      <div className="col-span-2 flex h-10 items-center">
        <Text size="sm" weight="medium">
          {formatarMoeda(valorTotal)}
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
