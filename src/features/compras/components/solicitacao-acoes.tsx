"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

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
import type { Tables } from "@/lib/supabase/database.types";

import {
  atualizarStatusSolicitacao,
  converterSolicitacaoEmPedido,
} from "../actions";

export interface SolicitacaoAcoesProps {
  solicitacaoId: string;
  status: string;
  fornecedores: Tables<"fornecedores">[];
}

export function SolicitacaoAcoes({
  solicitacaoId,
  status,
  fornecedores,
}: SolicitacaoAcoesProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [fornecedorId, setFornecedorId] = useState("");

  function alterarStatus(novoStatus: "aprovada" | "rejeitada") {
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarStatusSolicitacao(solicitacaoId, novoStatus);
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a solicitação.",
        );
      }
    });
  }

  function converter() {
    if (!fornecedorId) return;
    setErro(null);
    startTransition(async () => {
      try {
        const pedidoId = await converterSolicitacaoEmPedido(
          solicitacaoId,
          fornecedorId,
        );
        setDialogAberto(false);
        router.push(`/compras/pedidos/${pedidoId}`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível converter em pedido.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === "pendente" && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => alterarStatus("aprovada")}
            >
              <Check className="h-4 w-4" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => alterarStatus("rejeitada")}
            >
              <X className="h-4 w-4" />
              Rejeitar
            </Button>
          </>
        )}
        {status === "aprovada" && (
          <Button size="sm" disabled={pending} onClick={() => setDialogAberto(true)}>
            Converter em pedido
          </Button>
        )}
      </div>

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em pedido de compra</DialogTitle>
            <DialogDescription>
              Todos os itens da solicitação serão incluídos num único pedido
              (rascunho) para o fornecedor escolhido. Preços serão preenchidos
              a partir da tabela de preços do fornecedor, quando existirem.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fornecedorId">Fornecedor</Label>
            <Select
              id="fornecedorId"
              value={fornecedorId}
              onChange={(event) => setFornecedorId(event.target.value)}
            >
              <option value="" disabled>
                Selecionar...
              </option>
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </Select>
          </div>

          <DialogFooter>
            <Button onClick={converter} disabled={pending || !fornecedorId}>
              {pending ? "Convertendo..." : "Converter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
