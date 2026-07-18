"use client";

import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";

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
import { Text } from "@/components/ui/text";

import { criarAgenteImpressao } from "../actions";

export interface AgenteImpressaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgenteImpressaoDialog({ open, onOpenChange }: AgenteImpressaoDialogProps) {
  const [state, formAction, pending] = useActionState(criarAgenteImpressao, undefined);
  const [copiado, setCopiado] = useState(false);

  function fechar(novoEstado: boolean) {
    setCopiado(false);
    onOpenChange(novoEstado);
  }

  async function copiarChave() {
    if (!state?.chaveGerada) return;
    await navigator.clipboard.writeText(state.chaveGerada);
    setCopiado(true);
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent>
        {state?.chaveGerada ? (
          <>
            <DialogHeader>
              <DialogTitle>Agente criado</DialogTitle>
              <DialogDescription>
                Copie a chave agora — ela não é salva em texto puro e não
                pode ser recuperada depois. Configure-a no agente local (ver
                docs/AGENTE-LOCAL.md).
              </DialogDescription>
            </DialogHeader>
            <div className="bg-secondary flex items-center justify-between gap-2 rounded-md p-3">
              <code className="overflow-x-auto text-xs">{state.chaveGerada}</code>
              <Button type="button" variant="ghost" size="sm" onClick={copiarChave}>
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copiar</span>
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => fechar(false)}>
                Concluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Novo agente de impressão</DialogTitle>
              <DialogDescription>
                Identifica o computador Windows que vai consultar a fila de
                impressão e imprimir as etiquetas.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" placeholder="Ex: Balcão — cozinha" required />
                {state?.fieldErrors?.nome && (
                  <Text size="sm" tone="danger">
                    {state.fieldErrors.nome[0]}
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
                  {pending ? "Criando..." : "Criar agente"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
