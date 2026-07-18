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
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarMetaVendas, criarMetaVendas } from "../actions";

export interface MetaVendasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta?: Tables<"metas_vendas">;
}

export function MetaVendasDialog({
  open,
  onOpenChange,
  meta,
}: MetaVendasDialogProps) {
  const action = meta
    ? atualizarMetaVendas.bind(null, meta.id)
    : criarMetaVendas;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [valorMeta, setValorMeta] = useState<number | null>(
    () => meta?.valor_meta_receita ?? null,
  );
  const [quantidadeMeta, setQuantidadeMeta] = useState<number | null>(
    () => meta?.quantidade_meta ?? null,
  );

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta ? "Editar meta" : "Nova meta de vendas"}</DialogTitle>
          <DialogDescription>
            Uma meta de faturamento por mês — usada para calcular a margem de
            contribuição necessária no Painel e na Precificação.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mesReferencia">Mês de referência</Label>
            <Input
              id="mesReferencia"
              name="mesReferencia"
              type="month"
              defaultValue={meta?.mes_referencia.slice(0, 7)}
              required
            />
            {state?.fieldErrors?.mesReferencia && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.mesReferencia[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorMetaReceita">Meta de faturamento</Label>
              <CurrencyInput
                name="valorMetaReceita"
                value={valorMeta}
                onChange={setValorMeta}
                min={0}
                placeholder="R$ 0,00"
              />
              {state?.fieldErrors?.valorMetaReceita && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.valorMetaReceita[0]}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantidadeMeta">
                Quantidade de vendas (opcional)
              </Label>
              <NumberField
                name="quantidadeMeta"
                value={quantidadeMeta}
                onChange={setQuantidadeMeta}
                min={0}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              name="observacao"
              rows={2}
              defaultValue={meta?.observacao ?? ""}
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
