"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { finalizarCotacao } from "../actions";
import type { CotacaoFornecedorDetalhe } from "../queries";

export interface FinalizarCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacaoId: string;
  fornecedores: CotacaoFornecedorDetalhe[];
  fornecedorPreselecionadoId?: string;
}

export function FinalizarCotacaoDialog({
  open,
  onOpenChange,
  cotacaoId,
  fornecedores,
  fornecedorPreselecionadoId,
}: FinalizarCotacaoDialogProps) {
  const router = useRouter();
  const [fornecedorId, setFornecedorId] = useState(fornecedorPreselecionadoId ?? "");
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (!fornecedorId) return;
    if (!justificativa.trim()) {
      setErro("Informe a justificativa da escolha.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        const pedidoId = await finalizarCotacao(cotacaoId, fornecedorId, justificativa, false);
        onOpenChange(false);
        router.push(`/compras/pedidos/${pedidoId}`);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível finalizar a cotação.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar cotação (escolha manual)</DialogTitle>
          <DialogDescription>
            Um pedido de compra (rascunho) será criado para o fornecedor
            escolhido, com os preços e itens propostos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fornecedorId">Fornecedor vencedor</Label>
          <Select id="fornecedorId" value={fornecedorId} onChange={(event) => setFornecedorId(event.target.value)}>
            <option value="" disabled>
              Selecionar...
            </option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.fornecedorId} value={fornecedor.fornecedorId}>
                {fornecedor.fornecedorNome}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="justificativa">Justificativa</Label>
          <Textarea
            id="justificativa"
            rows={3}
            value={justificativa}
            onChange={(event) => setJustificativa(event.target.value)}
            placeholder="Por que este fornecedor foi escolhido, mesmo não sendo necessariamente o de menor custo total?"
          />
        </div>

        {erro && (
          <Text size="sm" tone="danger">
            {erro}
          </Text>
        )}

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || !fornecedorId}>
            {pending ? "Finalizando..." : "Finalizar cotação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
