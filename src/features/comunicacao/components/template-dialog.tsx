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

import { criarTemplate } from "../actions";

export function NovoTemplateDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Novo template
        </Button>
      </DialogTrigger>
      <NovoTemplateDialogForm onSaved={() => setOpen(false)} />
    </Dialog>
  );
}

/** Separado do componente pai para que "fechar ao salvar" seja uma chamada de prop (onSaved), não um setState local dentro de useEffect — mesmo formato de ClienteDialog/onOpenChange, que não dispara react-hooks/set-state-in-effect. */
function NovoTemplateDialogForm({ onSaved }: { onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(criarTemplate, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo template de mensagem</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="canal">Canal</Label>
            <Select id="canal" name="canal" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
              <option value="sms">SMS</option>
              <option value="interno">Interno</option>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assunto">Assunto (opcional, só e-mail)</Label>
          <Input id="assunto" name="assunto" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="conteudo">Conteúdo</Label>
          <Textarea id="conteudo" name="conteudo" rows={4} placeholder="Use {{nome}} para o nome do cliente" required />
          {state?.fieldErrors?.conteudo && (
            <Text size="sm" tone="danger">
              {state.fieldErrors.conteudo[0]}
            </Text>
          )}
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
