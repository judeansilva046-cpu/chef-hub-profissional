"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { criarPlanoConta } from "../actions";

export interface PlanoContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: Tables<"plano_contas">[];
}

const TIPO_OPCOES = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
  { value: "ativo", label: "Ativo" },
  { value: "passivo", label: "Passivo" },
] as const;

export function PlanoContaDialog({ open, onOpenChange, contas }: PlanoContaDialogProps) {
  const [state, formAction, pending] = useActionState(criarPlanoConta, undefined);
  const [contaPaiId, setContaPaiId] = useState<string | null>("");

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
          <DialogDescription>
            Categoriza contas a pagar, contas a receber e o DRE. Código livre (ex: 2.3.1), conta-pai opcional
            para até 2 níveis de hierarquia.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" name="codigo" placeholder="Ex: 2.3.1" required />
              {state?.fieldErrors?.codigo && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.codigo[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" name="tipo" defaultValue="despesa">
                {TIPO_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Ex: Manutenção de equipamentos" required />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conta-pai (opcional)</Label>
            <Combobox
              name="contaPaiId"
              options={[
                { value: "", label: "Nenhuma (conta de nível 1)" },
                ...contas.map((conta) => ({ value: conta.id, label: `${conta.codigo} — ${conta.nome}` })),
              ]}
              value={contaPaiId}
              onValueChange={setContaPaiId}
              placeholder="Selecionar conta-pai..."
              searchPlaceholder="Buscar..."
              emptyMessage="Nenhuma conta cadastrada."
            />
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
