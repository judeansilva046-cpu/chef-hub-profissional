"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

import { criarContaReceber } from "../actions";

export interface NovaContaReceberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: Tables<"clientes">[];
  planoContas: Tables<"plano_contas">[];
  centrosCusto: Tables<"centros_custo">[];
}

export function NovaContaReceberDialog({
  open,
  onOpenChange,
  clientes,
  planoContas,
  centrosCusto,
}: NovaContaReceberDialogProps) {
  const [state, formAction, pending] = useActionState(criarContaReceber, undefined);
  const [clienteId, setClienteId] = useState<string | null>("");
  const [planoContaId, setPlanoContaId] = useState<string | null>("");
  const [centroCustoId, setCentroCustoId] = useState<string | null>("");

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta a receber</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Ex: Encomenda de bolo — evento" required />
            {state?.fieldErrors?.descricao && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.descricao[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cliente (opcional)</Label>
            <Combobox
              name="clienteId"
              options={[{ value: "", label: "Nenhum" }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]}
              value={clienteId}
              onValueChange={setClienteId}
              placeholder="Selecionar cliente..."
              searchPlaceholder="Buscar..."
              emptyMessage="Nenhum cliente cadastrado."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorTotal">Valor total</Label>
              <Input id="valorTotal" name="valorTotal" type="number" step="0.01" min="0" required />
              {state?.fieldErrors?.valorTotal && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.valorTotal[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numeroParcelas">Parcelas</Label>
              <Input id="numeroParcelas" name="numeroParcelas" type="number" min="1" max="48" defaultValue="1" required />
              {state?.fieldErrors?.numeroParcelas && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.numeroParcelas[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="primeiraDataVencimento">1º vencimento</Label>
              <Input id="primeiraDataVencimento" name="primeiraDataVencimento" type="date" required />
              {state?.fieldErrors?.primeiraDataVencimento && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.primeiraDataVencimento[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Plano de contas (opcional)</Label>
              <Combobox
                name="planoContaId"
                options={[
                  { value: "", label: "Nenhuma" },
                  ...planoContas.map((c) => ({ value: c.id, label: `${c.codigo} — ${c.nome}` })),
                ]}
                value={planoContaId}
                onValueChange={setPlanoContaId}
                placeholder="Selecionar conta..."
                searchPlaceholder="Buscar..."
                emptyMessage="Nenhuma conta cadastrada."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Centro de custo (opcional)</Label>
              <Combobox
                name="centroCustoId"
                options={[{ value: "", label: "Nenhum" }, ...centrosCusto.map((c) => ({ value: c.id, label: c.nome }))]}
                value={centroCustoId}
                onValueChange={setCentroCustoId}
                placeholder="Selecionar centro..."
                searchPlaceholder="Buscar..."
                emptyMessage="Nenhum centro cadastrado."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea id="observacao" name="observacao" rows={2} />
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
