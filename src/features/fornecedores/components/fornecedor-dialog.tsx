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

import { atualizarFornecedor, criarFornecedor } from "../actions";

export interface FornecedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Tables<"fornecedores">;
}

export function FornecedorDialog({
  open,
  onOpenChange,
  fornecedor,
}: FornecedorDialogProps) {
  const action = fornecedor
    ? atualizarFornecedor.bind(null, fornecedor.id)
    : criarFornecedor;
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
          <DialogTitle>
            {fornecedor ? "Editar fornecedor" : "Novo fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Usado nas solicitações e pedidos de compra, e no comparativo de
            preços por ingrediente.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              placeholder="Ex: Distribuidora Bom Preço"
              defaultValue={fornecedor?.nome}
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
              <Label htmlFor="documento">CNPJ/CPF (opcional)</Label>
              <Input
                id="documento"
                name="documento"
                defaultValue={fornecedor?.documento ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={fornecedor?.telefone ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={fornecedor?.email ?? ""}
            />
            {state?.fieldErrors?.email && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.email[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endereco">Endereço (opcional)</Label>
            <Input
              id="endereco"
              name="endereco"
              defaultValue={fornecedor?.endereco ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              defaultValue={fornecedor?.observacoes ?? ""}
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
