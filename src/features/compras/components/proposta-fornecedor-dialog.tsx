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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/number-field";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { registrarPropostaFornecedor } from "../actions";
import type { CotacaoFornecedorDetalhe, CotacaoItemDetalhe } from "../queries";

export interface PropostaFornecedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacaoId: string;
  cotacaoFornecedor: CotacaoFornecedorDetalhe;
  itens: CotacaoItemDetalhe[];
}

export function PropostaFornecedorDialog({
  open,
  onOpenChange,
  cotacaoId,
  cotacaoFornecedor,
  itens,
}: PropostaFornecedorDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [prazoEntregaDias, setPrazoEntregaDias] = useState(
    cotacaoFornecedor.prazoEntregaDias?.toString() ?? "",
  );
  const [condicaoPagamento, setCondicaoPagamento] = useState(
    cotacaoFornecedor.condicaoPagamento ?? "",
  );
  const [valorFrete, setValorFrete] = useState<number | null>(cotacaoFornecedor.valorFrete);
  const [valorImpostos, setValorImpostos] = useState<number | null>(cotacaoFornecedor.valorImpostos);
  const [pedidoMinimo, setPedidoMinimo] = useState<number | null>(cotacaoFornecedor.pedidoMinimo);
  const [observacao, setObservacao] = useState(cotacaoFornecedor.observacao ?? "");
  const [precos, setPrecos] = useState<Record<string, number | null>>(() => {
    const inicial: Record<string, number | null> = {};
    for (const item of itens) {
      const proposta = cotacaoFornecedor.propostas.find((p) => p.cotacaoItemId === item.id);
      inicial[item.id] = proposta?.precoUnitario ?? null;
    }
    return inicial;
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    startTransition(async () => {
      try {
        await registrarPropostaFornecedor({
          cotacaoId,
          cotacaoFornecedorId: cotacaoFornecedor.id,
          prazoEntregaDias: prazoEntregaDias ? Number(prazoEntregaDias) : null,
          condicaoPagamento: condicaoPagamento.trim() || null,
          valorFrete,
          valorImpostos,
          pedidoMinimo,
          observacao: observacao.trim() || null,
          itens: itens
            .filter((item) => precos[item.id] !== null && precos[item.id] !== undefined)
            .map((item) => ({
              cotacaoItemId: item.id,
              precoUnitario: precos[item.id],
              atendePedidoMinimo: true,
            })),
        });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível registrar a proposta.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proposta de {cotacaoFornecedor.fornecedorNome}</DialogTitle>
          <DialogDescription>
            Registre o preço proposto para cada item e as condições gerais.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {itens.map((item) => (
              <div key={item.id} className="grid grid-cols-2 items-center gap-3">
                <Label className="font-normal">
                  {item.ingredienteNome}{" "}
                  <Text as="span" tone="muted" size="sm">
                    ({item.quantidade} {item.unidadeSigla})
                  </Text>
                </Label>
                <CurrencyInput
                  value={precos[item.id] ?? null}
                  onChange={(value) => setPrecos((atual) => ({ ...atual, [item.id]: value }))}
                  min={0}
                  placeholder="R$ 0,00 / un."
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prazoEntregaDias">Prazo de entrega, dias</Label>
              <Input
                id="prazoEntregaDias"
                type="number"
                step="1"
                min="0"
                value={prazoEntregaDias}
                onChange={(event) => setPrazoEntregaDias(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="condicaoPagamento">Condição de pagamento</Label>
              <Input
                id="condicaoPagamento"
                value={condicaoPagamento}
                onChange={(event) => setCondicaoPagamento(event.target.value)}
                placeholder="Ex: 28 dias"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorFrete">Frete</Label>
              <CurrencyInput id="valorFrete" value={valorFrete} onChange={setValorFrete} min={0} placeholder="R$ 0,00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorImpostos">Impostos</Label>
              <CurrencyInput id="valorImpostos" value={valorImpostos} onChange={setValorImpostos} min={0} placeholder="R$ 0,00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pedidoMinimo">Pedido mínimo</Label>
              <CurrencyInput id="pedidoMinimo" value={pedidoMinimo} onChange={setPedidoMinimo} min={0} placeholder="R$ 0,00" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              rows={2}
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
            />
          </div>

          {erro && (
            <Text size="sm" tone="danger">
              {erro}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
