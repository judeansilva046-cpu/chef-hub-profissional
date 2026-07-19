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
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { criarTarefa } from "../actions";

export interface NovaTarefaDialogProps {
  referenciaTipo?: "cliente" | "lead";
  referenciaId?: string;
  trigger?: React.ReactNode;
}

export function NovaTarefaDialog({ referenciaTipo, referenciaId, trigger }: NovaTarefaDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Nova tarefa</Button>}</DialogTrigger>
      <NovaTarefaDialogForm
        referenciaTipo={referenciaTipo}
        referenciaId={referenciaId}
        onSaved={() => setOpen(false)}
      />
    </Dialog>
  );
}

function NovaTarefaDialogForm({
  referenciaTipo,
  referenciaId,
  onSaved,
}: {
  referenciaTipo?: "cliente" | "lead";
  referenciaId?: string;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(criarTarefa, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova tarefa</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        {referenciaTipo && <input type="hidden" name="referenciaTipo" value={referenciaTipo} />}
        {referenciaId && <input type="hidden" name="referenciaId" value={referenciaId} />}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" name="titulo" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descricao">Descrição (opcional)</Label>
          <Textarea id="descricao" name="descricao" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select id="prioridade" name="prioridade" defaultValue="media">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prazo">Prazo (opcional)</Label>
            <Input id="prazo" name="prazo" type="datetime-local" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lembreteEm">Lembrete (opcional)</Label>
          <Input id="lembreteEm" name="lembreteEm" type="datetime-local" />
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
