"use client";

import { useActionState, useEffect } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

import { atualizarCliente, criarCliente } from "../actions";

export interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Tables<"clientes">;
}

export function ClienteDialog({ open, onOpenChange, cliente }: ClienteDialogProps) {
  const action = cliente ? atualizarCliente.bind(null, cliente.id) : criarCliente;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Cadastro de cliente para o CRM — histórico de pedidos, ticket
            médio e frequência são calculados a partir das vendas
            registradas.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Maria Souza"
              defaultValue={cliente?.nome}
              required
            />
            {state?.fieldErrors?.nome && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.nome[0]}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={cliente?.telefone ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail (opcional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={cliente?.email ?? ""}
              />
              {state?.fieldErrors?.email && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.email[0]}
                </Text>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documento">CPF/CNPJ (opcional)</Label>
              <Input
                id="documento"
                name="documento"
                defaultValue={cliente?.documento ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="segmento">Segmento (opcional)</Label>
              <Input
                id="segmento"
                name="segmento"
                list="segmento-sugestoes"
                placeholder="Ex: VIP, Recorrente"
                defaultValue={cliente?.segmento ?? ""}
              />
              <datalist id="segmento-sugestoes">
                <option value="Novo" />
                <option value="Recorrente" />
                <option value="VIP" />
                <option value="Inativo" />
              </datalist>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endereco">Endereço (opcional)</Label>
            <Input
              id="endereco"
              name="endereco"
              defaultValue={cliente?.endereco ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferencias">Preferências (opcional)</Label>
            <Textarea
              id="preferencias"
              name="preferencias"
              rows={2}
              placeholder="Ex: prefere sem lactose, gosta de sobremesas"
              defaultValue={cliente?.preferencias ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              defaultValue={cliente?.observacoes ?? ""}
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
