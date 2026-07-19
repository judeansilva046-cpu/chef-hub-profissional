"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";

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
import type { Tables } from "@/lib/supabase/database.types";

import {
  aprovarSolicitacaoCompra,
  converterSolicitacaoEmPedido,
  rejeitarSolicitacaoCompra,
  solicitarAjusteSolicitacaoCompra,
} from "../actions";

export interface SolicitacaoAcoesProps {
  solicitacaoId: string;
  status: string;
  fornecedores: Tables<"fornecedores">[];
  podeAprovar: boolean;
}

type Decisao = "aprovar" | "rejeitar" | "ajuste" | null;

export function SolicitacaoAcoes({
  solicitacaoId,
  status,
  fornecedores,
  podeAprovar,
}: SolicitacaoAcoesProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [decisao, setDecisao] = useState<Decisao>(null);
  const [comentario, setComentario] = useState("");
  const [converterAberto, setConverterAberto] = useState(false);
  const [fornecedorId, setFornecedorId] = useState("");

  function abrirDecisao(novaDecisao: Decisao) {
    setErro(null);
    setComentario("");
    setDecisao(novaDecisao);
  }

  function confirmarDecisao() {
    if (!decisao) return;
    if (decisao !== "aprovar" && !comentario.trim()) {
      setErro(
        decisao === "rejeitar"
          ? "Informe o motivo da rejeição."
          : "Informe o que precisa ser ajustado.",
      );
      return;
    }

    setErro(null);
    startTransition(async () => {
      try {
        if (decisao === "aprovar") {
          await aprovarSolicitacaoCompra(solicitacaoId, comentario);
        } else if (decisao === "rejeitar") {
          await rejeitarSolicitacaoCompra(solicitacaoId, comentario);
        } else {
          await solicitarAjusteSolicitacaoCompra(solicitacaoId, comentario);
        }
        setDecisao(null);
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível registrar a decisão.",
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
        setConverterAberto(false);
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

  const podeDecidir =
    podeAprovar && (status === "pendente" || status === "ajuste_solicitado");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {podeDecidir && (
          <>
            <Button size="sm" disabled={pending} onClick={() => abrirDecisao("aprovar")}>
              <Check className="h-4 w-4" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => abrirDecisao("rejeitar")}
            >
              <X className="h-4 w-4" />
              Rejeitar
            </Button>
            {status === "pendente" && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => abrirDecisao("ajuste")}
              >
                <AlertTriangle className="h-4 w-4" />
                Solicitar ajuste
              </Button>
            )}
          </>
        )}
        {status === "aprovada" && (
          <Button size="sm" disabled={pending} onClick={() => setConverterAberto(true)}>
            Converter em pedido
          </Button>
        )}
      </div>

      {erro && !decisao && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      <Dialog open={decisao !== null} onOpenChange={(open) => !open && setDecisao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisao === "aprovar" && "Aprovar solicitação"}
              {decisao === "rejeitar" && "Rejeitar solicitação"}
              {decisao === "ajuste" && "Solicitar ajuste"}
            </DialogTitle>
            <DialogDescription>
              {decisao === "aprovar" &&
                "A solicitação poderá ser convertida em pedido de compra."}
              {decisao === "rejeitar" && "Explique por que esta solicitação está sendo rejeitada."}
              {decisao === "ajuste" && "Explique o que precisa ser corrigido antes de aprovar."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">
              {decisao === "aprovar" ? "Comentário (opcional)" : "Motivo"}
            </Label>
            <Textarea
              id="comentario"
              rows={3}
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
            />
          </div>

          {erro && (
            <Text size="sm" tone="danger">
              {erro}
            </Text>
          )}

          <DialogFooter>
            <Button onClick={confirmarDecisao} disabled={pending}>
              {pending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={converterAberto} onOpenChange={setConverterAberto}>
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

          {erro && (
            <Text size="sm" tone="danger">
              {erro}
            </Text>
          )}

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
