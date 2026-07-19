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
import type { Tables } from "@/lib/supabase/database.types";

import { criarLead } from "../actions";

export function NovoLeadDialog({ etapas }: { etapas: Tables<"crm_funil_etapas">[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo lead</Button>
      </DialogTrigger>
      <NovoLeadDialogForm etapas={etapas} onSaved={() => setOpen(false)} />
    </Dialog>
  );
}

function NovoLeadDialogForm({
  etapas,
  onSaved,
}: {
  etapas: Tables<"crm_funil_etapas">[];
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(criarLead, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo lead</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="etapaId">Etapa</Label>
            <Select id="etapaId" name="etapaId" defaultValue={etapas[0]?.id}>
              {etapas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input id="telefone" name="telefone" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input id="email" name="email" type="email" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="origem">Origem (opcional)</Label>
            <Input id="origem" name="origem" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valorEstimado">Valor estimado (R$)</Label>
            <Input id="valorEstimado" name="valorEstimado" type="number" step="0.01" min="0" defaultValue={0} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="probabilidade">Probabilidade (%)</Label>
            <Input id="probabilidade" name="probabilidade" type="number" step="1" min="0" max="100" defaultValue={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proximaAcaoEm">Próxima ação em (opcional)</Label>
            <Input id="proximaAcaoEm" name="proximaAcaoEm" type="date" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="proximaAcao">Próxima ação (opcional)</Label>
          <Input id="proximaAcao" name="proximaAcao" placeholder="Ex: ligar amanhã" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="observacoes">Observações (opcional)</Label>
          <Textarea id="observacoes" name="observacoes" rows={2} />
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
