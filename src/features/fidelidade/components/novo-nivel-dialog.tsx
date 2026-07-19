"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { criarNivelFidelidade } from "../actions";

export function NovoNivelDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Novo nível
        </Button>
      </DialogTrigger>
      <NovoNivelDialogForm onSaved={() => setOpen(false)} />
    </Dialog>
  );
}

function NovoNivelDialogForm({ onSaved }: { onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(criarNivelFidelidade, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo nível de fidelidade</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Ex: Ouro" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pontosMinimos">Pontos mínimos</Label>
            <Input id="pontosMinimos" name="pontosMinimos" type="number" step="0.01" min="0" required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="beneficios">Benefícios (opcional)</Label>
          <Textarea id="beneficios" name="beneficios" rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ordem">Ordem de exibição</Label>
          <Input id="ordem" name="ordem" type="number" step="1" defaultValue={0} />
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
