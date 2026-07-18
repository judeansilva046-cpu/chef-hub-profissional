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

import { atualizarCustoFixo, criarCustoFixo } from "../actions";
import { CATEGORIA_CUSTO_FIXO_OPCOES } from "../validation";

export interface CustoFixoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custoFixo?: Tables<"custos_fixos">;
}

export function CustoFixoDialog({
  open,
  onOpenChange,
  custoFixo,
}: CustoFixoDialogProps) {
  const action = custoFixo
    ? atualizarCustoFixo.bind(null, custoFixo.id)
    : criarCustoFixo;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [valorMensal, setValorMensal] = useState<number | null>(
    () => custoFixo?.valor_mensal ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {custoFixo ? "Editar custo fixo" : "Novo custo fixo"}
          </DialogTitle>
          <DialogDescription>
            Despesas recorrentes mensais, independentes do volume de vendas
            (aluguel, salários, contas). Base do Ponto de Equilíbrio e do
            Painel Nunca no Vermelho.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Aluguel da cozinha"
              defaultValue={custoFixo?.nome}
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
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                id="categoria"
                name="categoria"
                defaultValue={custoFixo?.categoria ?? "outros"}
              >
                {CATEGORIA_CUSTO_FIXO_OPCOES.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorMensal">Valor mensal</Label>
              <CurrencyInput
                name="valorMensal"
                value={valorMensal}
                onChange={setValorMensal}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.valorMensal && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.valorMensal[0]}
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
