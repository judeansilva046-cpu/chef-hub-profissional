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

import { criarEtapaFunil } from "../actions";

export function NovaEtapaDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Nova etapa
        </Button>
      </DialogTrigger>
      <NovaEtapaDialogForm onSaved={() => setOpen(false)} />
    </Dialog>
  );
}

function NovaEtapaDialogForm({ onSaved }: { onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(criarEtapaFunil, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova etapa do funil</DialogTitle>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cor">Cor</Label>
            <Input id="cor" name="cor" type="color" defaultValue="#64748b" className="h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ordem">Ordem</Label>
            <Input id="ordem" name="ordem" type="number" step="1" defaultValue={0} />
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
  );
}
