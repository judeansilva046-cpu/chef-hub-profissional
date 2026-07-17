"use client";

import { useActionState, useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";

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
import { NumberField } from "@/components/ui/number-field";
import { Text } from "@/components/ui/text";

import { receberItemPedido } from "../actions";
import type { PedidoItemComIngrediente } from "../queries";

interface ReceberItemDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  item: PedidoItemComIngrediente;
  pendente: number;
}

function ReceberItemDialogContent({
  open,
  onOpenChange,
  pedidoId,
  item,
  pendente,
}: ReceberItemDialogContentProps) {
  const action = receberItemPedido.bind(null, pedidoId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [quantidade, setQuantidade] = useState<number | null>(pendente);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receber {item.ingredientes.nome}</DialogTitle>
          <DialogDescription>
            Cria um novo lote de estoque com o custo do pedido. Pendente:{" "}
            {pendente} {item.ingredientes.unidades_medida.sigla}.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="pedidoItemId" value={item.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="receber-quantidade">
              Quantidade recebida ({item.ingredientes.unidades_medida.sigla})
            </Label>
            <NumberField
              id="receber-quantidade"
              name="quantidade"
              value={quantidade}
              onChange={setQuantidade}
              min={0}
              max={pendente}
              placeholder="0"
            />
            {state?.fieldErrors?.quantidade && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.quantidade[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-numeroLote">Nº do lote (opcional)</Label>
              <Input id="receber-numeroLote" name="numeroLote" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-dataValidade">Validade (opcional)</Label>
              <Input id="receber-dataValidade" name="dataValidade" type="date" />
            </div>
          </div>

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando..." : "Confirmar recebimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ReceberItemDialogProps {
  pedidoId: string;
  item: PedidoItemComIngrediente;
}

export function ReceberItemDialog({ pedidoId, item }: ReceberItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const pendente = item.quantidade_pedida - item.quantidade_recebida;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen(true);
          setDialogKey((key) => key + 1);
        }}
      >
        <PackageCheck className="h-4 w-4" />
        Receber
      </Button>

      <ReceberItemDialogContent
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        pedidoId={pedidoId}
        item={item}
        pendente={pendente}
      />
    </>
  );
}
