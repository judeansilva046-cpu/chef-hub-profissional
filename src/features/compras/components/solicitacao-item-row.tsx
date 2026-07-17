"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { NumberField } from "@/components/ui/number-field";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";

import type { SolicitacaoItemFormState } from "../types";

export interface SolicitacaoItemRowProps {
  item: SolicitacaoItemFormState;
  ingredientes: IngredienteParaSelecao[];
  onChange: (item: SolicitacaoItemFormState) => void;
  onRemove: () => void;
  podeRemover: boolean;
}

export function SolicitacaoItemRow({
  item,
  ingredientes,
  onChange,
  onRemove,
  podeRemover,
}: SolicitacaoItemRowProps) {
  const ingrediente = ingredientes.find((i) => i.id === item.ingredienteId);

  return (
    <div className="border-border grid grid-cols-12 items-center gap-3 border-b py-3 last:border-0">
      <div className="col-span-8">
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

      <div className="col-span-3">
        <NumberField
          value={item.quantidade}
          onChange={(value) => onChange({ ...item, quantidade: value })}
          min={0}
          placeholder={ingrediente ? `Qtd. (${ingrediente.unidades_medida.sigla})` : "Quantidade"}
        />
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
