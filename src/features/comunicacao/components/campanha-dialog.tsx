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

import { criarCampanha } from "../actions";

export interface CampanhaDialogProps {
  templates: { id: string; nome: string }[];
  cupons: { id: string; codigo: string }[];
}

export function NovaCampanhaDialog({ templates, cupons }: CampanhaDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova campanha</Button>
      </DialogTrigger>
      <NovaCampanhaDialogForm templates={templates} cupons={cupons} onSaved={() => setOpen(false)} />
    </Dialog>
  );
}

function NovaCampanhaDialogForm({
  templates,
  cupons,
  onSaved,
}: CampanhaDialogProps & { onSaved: () => void }) {
  const [state, formAction, pending] = useActionState(criarCampanha, undefined);
  const [gatilho, setGatilho] = useState("aniversario");

  useEffect(() => {
    if (state?.success) onSaved();
  }, [state?.success, onSaved]);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova campanha automática</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gatilho">Gatilho</Label>
            <Select id="gatilho" name="gatilho" value={gatilho} onChange={(e) => setGatilho(e.target.value)}>
              <option value="aniversario">Aniversário</option>
              <option value="inatividade">Inatividade</option>
              <option value="primeira_compra">Primeira compra</option>
              <option value="manual">Manual</option>
            </Select>
          </div>
          {gatilho === "inatividade" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="diasInatividade">Dias sem comprar</Label>
              <Input id="diasInatividade" name="diasInatividade" type="number" step="1" min="1" defaultValue={60} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="templateId">Template</Label>
            <Select id="templateId" name="templateId" required>
              <option value="">Selecione...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.nome}
                </option>
              ))}
            </Select>
            {state?.fieldErrors?.templateId && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.templateId[0]}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cupomId">Cupom (opcional)</Label>
            <Select id="cupomId" name="cupomId" defaultValue="">
              <option value="">Nenhum</option>
              {cupons.map((cupom) => (
                <option key={cupom.id} value={cupom.id}>
                  {cupom.codigo}
                </option>
              ))}
            </Select>
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
