"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PackageCheck } from "lucide-react";

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
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { registrarRecebimentoItem } from "../actions";
import type { PedidoItemComIngrediente } from "../queries";

interface ReceberItemDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  item: PedidoItemComIngrediente;
  pendente: number;
}

function ReceberItemDialogContent({
  open,
  onOpenChange,
  pedidoId,
  item,
  pendente,
}: ReceberItemDialogContentProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [quantidadeRecebida, setQuantidadeRecebida] = useState<number | null>(pendente);
  const [quantidadeRecusada, setQuantidadeRecusada] = useState<number | null>(null);
  const [precoConferido, setPrecoConferido] = useState<number | null>(item.preco_unitario);
  const [numeroLote, setNumeroLote] = useState("");
  const [dataFabricacao, setDataFabricacao] = useState("");
  const [dataValidade, setDataValidade] = useState("");
  const [motivoDivergencia, setMotivoDivergencia] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    startTransition(async () => {
      try {
        await registrarRecebimentoItem(pedidoId, {
          pedidoItemId: item.id,
          quantidadeRecebida,
          quantidadeRecusada,
          precoConferido,
          numeroLote: numeroLote || null,
          dataFabricacao: dataFabricacao || null,
          dataValidade: dataValidade || null,
          motivoDivergencia: motivoDivergencia || null,
        });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível registrar o recebimento.",
        );
      }
    });
  }

  const precoDivergente = precoConferido !== null && precoConferido !== item.preco_unitario;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receber {item.ingredientes.nome}</DialogTitle>
          <DialogDescription>
            Cria um novo lote de estoque com o preço conferido. Pendente:{" "}
            {pendente} {item.ingredientes.unidades_medida.sigla}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-quantidade">
                Quantidade recebida ({item.ingredientes.unidades_medida.sigla})
              </Label>
              <NumberField
                id="receber-quantidade"
                value={quantidadeRecebida}
                onChange={setQuantidadeRecebida}
                min={0}
                max={pendente}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-recusada">Quantidade recusada (opcional)</Label>
              <NumberField
                id="receber-recusada"
                value={quantidadeRecusada}
                onChange={setQuantidadeRecusada}
                min={0}
                max={pendente}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="receber-preco">Preço conferido na nota</Label>
            <CurrencyInput
              id="receber-preco"
              value={precoConferido}
              onChange={setPrecoConferido}
              min={0}
              placeholder="R$ 0,00"
            />
            {precoDivergente && (
              <Text size="sm" tone="warning">
                Diverge do preço do pedido ({item.preco_unitario}) — será marcado como divergência.
              </Text>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-numeroLote">Nº do lote (opcional)</Label>
              <Input id="receber-numeroLote" value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-dataFabricacao">Fabricação (opcional)</Label>
              <Input
                id="receber-dataFabricacao"
                type="date"
                value={dataFabricacao}
                onChange={(e) => setDataFabricacao(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receber-dataValidade">Validade (opcional)</Label>
              <Input
                id="receber-dataValidade"
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="receber-motivo">
              Motivo da divergência / recusa{(quantidadeRecusada ?? 0) > 0 ? "" : " (opcional)"}
            </Label>
            <Textarea
              id="receber-motivo"
              rows={2}
              value={motivoDivergencia}
              onChange={(e) => setMotivoDivergencia(e.target.value)}
              placeholder="Ex: 2 unidades avariadas na entrega"
            />
          </div>

          {erro && (
            <Text size="sm" tone="danger">
              {erro}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando..." : "Confirmar recebimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export interface ReceberItemDialogProps {
  pedidoId: string;
  item: PedidoItemComIngrediente;
}

export function ReceberItemDialog({ pedidoId, item }: ReceberItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const pendente = item.quantidade_pedida - item.quantidade_recebida - item.quantidade_recusada;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setOpen(true);
          setDialogKey((key) => key + 1);
        }}
      >
        <PackageCheck className="h-4 w-4" />
        Receber
      </Button>

      <ReceberItemDialogContent
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        pedidoId={pedidoId}
        item={item}
        pendente={pendente}
      />
    </>
  );
}
