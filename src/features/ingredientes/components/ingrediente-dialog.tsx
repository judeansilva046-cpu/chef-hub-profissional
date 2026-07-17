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
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarIngrediente, criarIngrediente } from "../actions";
import type { IngredienteComRelacoes } from "../queries";

export interface IngredienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingrediente?: IngredienteComRelacoes;
  categorias: Tables<"categorias_ingredientes">[];
  unidades: Tables<"unidades_medida">[];
}

export function IngredienteDialog({
  open,
  onOpenChange,
  ingrediente,
  categorias,
  unidades,
}: IngredienteDialogProps) {
  const action = ingrediente
    ? atualizarIngrediente.bind(null, ingrediente.id)
    : criarIngrediente;
  const [state, formAction, pending] = useActionState(action, undefined);
  // O chamador (IngredientesTable / NovoIngredienteButton) usa `key` para
  // remontar este componente a cada abertura do diálogo — por isso o
  // inicializador abaixo é suficiente, sem precisar de um efeito para
  // resincronizar com a prop `ingrediente` quando `open` muda.
  const [custo, setCusto] = useState<number | null>(
    () => ingrediente?.custo_unitario_atual ?? null,
  );
  const [estoqueMinimo, setEstoqueMinimo] = useState<number | null>(
    () => ingrediente?.estoque_minimo ?? 0,
  );

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
            {ingrediente ? "Editar ingrediente" : "Novo ingrediente"}
          </DialogTitle>
          <DialogDescription>
            O custo unitário é usado no cálculo automático das fichas técnicas
            que usam este ingrediente.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Farinha de trigo"
              defaultValue={ingrediente?.nome}
              required
            />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoriaId">Categoria</Label>
              <Select
                id="categoriaId"
                name="categoriaId"
                defaultValue={ingrediente?.categoria_id ?? ""}
              >
                <option value="">Sem categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unidadeMedidaId">Unidade</Label>
              <Select
                id="unidadeMedidaId"
                name="unidadeMedidaId"
                defaultValue={ingrediente?.unidade_medida_id ?? ""}
                required
              >
                <option value="" disabled>
                  Selecionar...
                </option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome} ({unidade.sigla})
                  </option>
                ))}
              </Select>
              {state?.fieldErrors?.unidadeMedidaId && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.unidadeMedidaId[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custoUnitarioAtual">Custo unitário atual</Label>
              <CurrencyInput
                name="custoUnitarioAtual"
                value={custo}
                onChange={setCusto}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.custoUnitarioAtual && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.custoUnitarioAtual[0]}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estoqueMinimo">Estoque mínimo</Label>
              <NumberField
                name="estoqueMinimo"
                value={estoqueMinimo}
                onChange={setEstoqueMinimo}
                min={0}
                placeholder="0"
              />
              {state?.fieldErrors?.estoqueMinimo && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.estoqueMinimo[0]}
                </Text>
              )}
            </div>
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
