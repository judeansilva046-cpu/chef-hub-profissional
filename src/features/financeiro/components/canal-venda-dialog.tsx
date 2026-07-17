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
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarCanalVenda, criarCanalVenda } from "../actions";
import { TIPO_CANAL_OPCOES } from "../validation";

export interface CanalVendaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canal?: Tables<"canais_venda">;
}

export function CanalVendaDialog({
  open,
  onOpenChange,
  canal,
}: CanalVendaDialogProps) {
  const action = canal
    ? atualizarCanalVenda.bind(null, canal.id)
    : criarCanalVenda;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [taxaPercentual, setTaxaPercentual] = useState<number | null>(
    () => canal?.taxa_percentual ?? null,
  );
  const [taxaFixa, setTaxaFixa] = useState<number | null>(
    () => canal?.taxa_fixa ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{canal ? "Editar canal" : "Novo canal de venda"}</DialogTitle>
          <DialogDescription>
            Comissão e taxa fixa cobradas pelo canal (iFood, 99Food, Keeta,
            Delivery Próprio ou um canal personalizado) — usadas para
            comparar preço e margem por canal na Precificação.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" name="tipo" defaultValue={canal?.tipo ?? "personalizado"}>
                {TIPO_CANAL_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex: iFood, Balcão, WhatsApp"
                defaultValue={canal?.nome}
                required
              />
              {state?.fieldErrors?.nome && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.nome[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxaPercentual">Comissão (%)</Label>
              <NumberField
                name="taxaPercentual"
                kind="percent"
                value={taxaPercentual}
                onChange={setTaxaPercentual}
                min={0}
                max={100}
                placeholder="0%"
              />
              {state?.fieldErrors?.taxaPercentual && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.taxaPercentual[0]}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxaFixa">Taxa fixa por venda</Label>
              <CurrencyInput
                name="taxaFixa"
                value={taxaFixa}
                onChange={setTaxaFixa}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.taxaFixa && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.taxaFixa[0]}
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
