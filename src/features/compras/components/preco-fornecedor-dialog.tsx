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
import { CurrencyInput } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarPrecoFornecedor } from "../actions";
import type { PrecoFornecedorItem } from "../queries";

export interface PrecoFornecedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredienteId: string;
  ingredienteNome: string;
  fornecedores: Tables<"fornecedores">[];
  unidadesMedida: Tables<"unidades_medida">[];
  registro?: PrecoFornecedorItem;
}

export function PrecoFornecedorDialog({
  open,
  onOpenChange,
  ingredienteId,
  ingredienteNome,
  fornecedores,
  unidadesMedida,
  registro,
}: PrecoFornecedorDialogProps) {
  const [state, formAction, pending] = useActionState(
    salvarPrecoFornecedor,
    undefined,
  );
  const [preco, setPreco] = useState<number | null>(
    registro?.precoUnitario ?? null,
  );
  const [pedidoMinimo, setPedidoMinimo] = useState<number | null>(
    registro?.pedidoMinimo ?? null,
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

          <div className="grid grid-cols-2 gap-4">
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
                id="precoUnitario"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="codigoFornecedor">
                Código no fornecedor (opcional)
              </Label>
              <Input
                id="codigoFornecedor"
                name="codigoFornecedor"
                defaultValue={registro?.codigoFornecedor ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="marca">Marca (opcional)</Label>
              <Input id="marca" name="marca" defaultValue={registro?.marca ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="embalagem">Embalagem (opcional)</Label>
              <Input
                id="embalagem"
                name="embalagem"
                placeholder="Ex: Caixa com 12 un."
                defaultValue={registro?.embalagem ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantidadeEmbalagem">
                Quantidade por embalagem
              </Label>
              <Input
                id="quantidadeEmbalagem"
                name="quantidadeEmbalagem"
                type="number"
                step="0.0001"
                min="0.0001"
                defaultValue={registro?.quantidadeEmbalagem ?? 1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unidadeCompraId">Unidade de compra (opcional)</Label>
              <Select
                id="unidadeCompraId"
                name="unidadeCompraId"
                defaultValue={registro?.unidadeCompraId ?? ""}
              >
                <option value="">Mesma do estoque</option>
                {unidadesMedida.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome} ({unidade.sigla})
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fatorConversao">
                Conversão para unidade de estoque
              </Label>
              <Input
                id="fatorConversao"
                name="fatorConversao"
                type="number"
                step="0.000001"
                min="0.000001"
                defaultValue={registro?.fatorConversao ?? 1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prazoEntregaDias">
                Prazo de entrega, dias (opcional)
              </Label>
              <Input
                id="prazoEntregaDias"
                name="prazoEntregaDias"
                type="number"
                step="1"
                min="0"
                defaultValue={registro?.prazoEntregaDias ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pedidoMinimo">Pedido mínimo (opcional)</Label>
              <CurrencyInput
                id="pedidoMinimo"
                name="pedidoMinimo"
                value={pedidoMinimo}
                onChange={setPedidoMinimo}
                min={0}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="preferencial"
              defaultChecked={registro?.preferencial ?? false}
            />
            Fornecedor preferencial para este ingrediente
          </label>

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
