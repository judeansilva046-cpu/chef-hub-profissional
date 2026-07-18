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

import { criarContaPagar } from "../actions";

export interface NovaContaPagarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedores: Tables<"fornecedores">[];
  planoContas: Tables<"plano_contas">[];
  centrosCusto: Tables<"centros_custo">[];
}

export function NovaContaPagarDialog({
  open,
  onOpenChange,
  fornecedores,
  planoContas,
  centrosCusto,
}: NovaContaPagarDialogProps) {
  const [state, formAction, pending] = useActionState(criarContaPagar, undefined);
  const [fornecedorId, setFornecedorId] = useState<string | null>("");
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
          <DialogTitle>Nova conta a pagar</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Ex: Manutenção do forno" required />
            {state?.fieldErrors?.descricao && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.descricao[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor</Label>
              <Input id="valor" name="valor" type="number" step="0.01" min="0" required />
              {state?.fieldErrors?.valor && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.valor[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataVencimento">Vencimento</Label>
              <Input id="dataVencimento" name="dataVencimento" type="date" required />
              {state?.fieldErrors?.dataVencimento && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.dataVencimento[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fornecedor (opcional)</Label>
            <Combobox
              name="fornecedorId"
              options={[
                { value: "", label: "Nenhum" },
                ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
              ]}
              value={fornecedorId}
              onValueChange={setFornecedorId}
              placeholder="Selecionar fornecedor..."
              searchPlaceholder="Buscar..."
              emptyMessage="Nenhum fornecedor cadastrado."
            />
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
                options={[
                  { value: "", label: "Nenhum" },
                  ...centrosCusto.map((c) => ({ value: c.id, label: c.nome })),
                ]}
                value={centroCustoId}
                onValueChange={setCentroCustoId}
                placeholder="Selecionar centro..."
                searchPlaceholder="Buscar..."
                emptyMessage="Nenhum centro cadastrado."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numeroDocumento">Número do documento (opcional)</Label>
            <Input id="numeroDocumento" name="numeroDocumento" placeholder="Ex: NF 1234 / boleto" />
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
