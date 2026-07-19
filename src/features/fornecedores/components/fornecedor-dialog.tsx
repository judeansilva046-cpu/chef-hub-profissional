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
import { CATEGORIA_FORNECEDOR_SUGESTOES } from "../validation";

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

  const dadosBancarios = fornecedor?.dados_bancarios as
    | { banco?: string; agencia?: string; conta?: string; tipoConta?: string }
    | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fornecedor ? "Editar fornecedor" : "Novo fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Usado nas solicitações, cotações, pedidos de compra e no
            comparativo de preços por ingrediente.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Razão social</Label>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex: Distribuidora Bom Preço Ltda"
                defaultValue={fornecedor?.nome}
                required
              />
              {state?.fieldErrors?.nome && (
                <Text size="sm" tone="danger">
                  {state.fieldErrors.nome[0]}
                </Text>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nomeFantasia">Nome fantasia (opcional)</Label>
              <Input id="nomeFantasia" name="nomeFantasia" defaultValue={fornecedor?.nome_fantasia ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="documento">CNPJ/CPF (opcional)</Label>
              <Input id="documento" name="documento" defaultValue={fornecedor?.documento ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inscricaoEstadual">Inscrição estadual (opcional)</Label>
              <Input id="inscricaoEstadual" name="inscricaoEstadual" defaultValue={fornecedor?.inscricao_estadual ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input id="telefone" name="telefone" defaultValue={fornecedor?.telefone ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={fornecedor?.whatsapp ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contatoNome">Contato (opcional)</Label>
              <Input id="contatoNome" name="contatoNome" placeholder="Nome do vendedor" defaultValue={fornecedor?.contato_nome ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail (opcional)</Label>
            <Input id="email" name="email" type="email" defaultValue={fornecedor?.email ?? ""} />
            {state?.fieldErrors?.email && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.email[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endereco">Endereço (opcional)</Label>
            <Input id="endereco" name="endereco" defaultValue={fornecedor?.endereco ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categorias">Categorias (opcional)</Label>
            <Input
              id="categorias"
              name="categorias"
              list="categorias-sugestoes"
              placeholder="Separadas por vírgula"
              defaultValue={fornecedor?.categorias?.join(", ") ?? ""}
            />
            <datalist id="categorias-sugestoes">
              {CATEGORIA_FORNECEDOR_SUGESTOES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="condicoesPagamento">Condições de pagamento (opcional)</Label>
              <Input id="condicoesPagamento" name="condicoesPagamento" placeholder="Ex: 28 dias" defaultValue={fornecedor?.condicoes_pagamento ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prazoMedioEntregaDias">Prazo médio de entrega, dias (opcional)</Label>
              <Input id="prazoMedioEntregaDias" name="prazoMedioEntregaDias" type="number" step="1" min="0" defaultValue={fornecedor?.prazo_medio_entrega_dias ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pedidoMinimo">Pedido mínimo, R$ (opcional)</Label>
              <Input id="pedidoMinimo" name="pedidoMinimo" type="number" step="0.01" min="0" defaultValue={fornecedor?.pedido_minimo ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Dados bancários (opcional)</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input name="banco" placeholder="Banco" defaultValue={dadosBancarios?.banco ?? ""} />
              <Input name="agencia" placeholder="Agência" defaultValue={dadosBancarios?.agencia ?? ""} />
              <Input name="conta" placeholder="Conta" defaultValue={dadosBancarios?.conta ?? ""} />
              <Input name="tipoConta" placeholder="Tipo (corrente/poupança)" defaultValue={dadosBancarios?.tipoConta ?? ""} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chavePix">Chave PIX (opcional)</Label>
            <Input id="chavePix" name="chavePix" defaultValue={fornecedor?.chave_pix ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea id="observacoes" name="observacoes" rows={2} defaultValue={fornecedor?.observacoes ?? ""} />
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
