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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { criarSegmentoPersonalizado } from "../actions";

export function NovoSegmentoDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Novo segmento personalizado</Button>
      </DialogTrigger>
      <NovoSegmentoDialogForm onSaved={() => setOpen(false)} />
    </Dialog>
  );
}

function NovoSegmentoDialogForm({ onSaved }: { onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(criarSegmentoPersonalizado, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo segmento personalizado</DialogTitle>
        <DialogDescription>
          A lista de clientes deste segmento é sempre recalculada na hora
          (nenhum cliente fica gravado aqui) — só os critérios ficam
          salvos.
        </DialogDescription>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
          {state?.fieldErrors?.nome && (
            <Text size="sm" tone="danger">
              {state.fieldErrors.nome[0]}
            </Text>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Textarea id="descricao" name="descricao" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gastoMinimo">Gasto total mínimo (opcional)</Label>
            <Input id="gastoMinimo" name="gastoMinimo" type="number" step="0.01" min="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gastoMaximo">Gasto total máximo (opcional)</Label>
            <Input id="gastoMaximo" name="gastoMaximo" type="number" step="0.01" min="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticketMedioMinimo">Ticket médio mínimo (opcional)</Label>
            <Input id="ticketMedioMinimo" name="ticketMedioMinimo" type="number" step="0.01" min="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="frequenciaMinima">Nº mínimo de compras (opcional)</Label>
            <Input id="frequenciaMinima" name="frequenciaMinima" type="number" step="1" min="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diasSemComprarMinimo">Dias sem comprar, no mínimo (opcional)</Label>
            <Input id="diasSemComprarMinimo" name="diasSemComprarMinimo" type="number" step="1" min="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="origem">Origem (opcional)</Label>
            <Input id="origem" name="origem" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tags">Tags — qualquer uma (opcional)</Label>
          <Input id="tags" name="tags" placeholder="Separadas por vírgula" />
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
  );
}
