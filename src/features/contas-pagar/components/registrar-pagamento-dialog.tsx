"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";

import { registrarPagamentoContaPagar } from "../actions";
import type { ContaPagarComRelacoes } from "../queries";
import { FORMAS_PAGAMENTO_CONTA_PAGAR } from "../validation";

const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
};

export interface RegistrarPagamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaPagarComRelacoes;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RegistrarPagamentoDialog({ open, onOpenChange, conta }: RegistrarPagamentoDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [valorPago, setValorPago] = useState(conta.valor.toFixed(2));
  const [formaPagamento, setFormaPagamento] = useState<(typeof FORMAS_PAGAMENTO_CONTA_PAGAR)[number]>("pix");
  const [dataPagamento, setDataPagamento] = useState(hoje());

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        await registrarPagamentoContaPagar(conta.id, {
          valorPago: Number(valorPago),
          formaPagamento,
          dataPagamento,
        });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível registrar o pagamento.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Text tone="muted">
            {conta.descricao} — {formatarMoeda(conta.valor)}
          </Text>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorPago">Valor pago</Label>
              <Input
                id="valorPago"
                type="number"
                step="0.01"
                min="0"
                value={valorPago}
                onChange={(event) => setValorPago(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataPagamento">Data do pagamento</Label>
              <Input
                id="dataPagamento"
                type="date"
                value={dataPagamento}
                onChange={(event) => setDataPagamento(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="formaPagamento">Forma de pagamento</Label>
            <Select
              id="formaPagamento"
              value={formaPagamento}
              onChange={(event) =>
                setFormaPagamento(event.target.value as (typeof FORMAS_PAGAMENTO_CONTA_PAGAR)[number])
              }
            >
              {FORMAS_PAGAMENTO_CONTA_PAGAR.map((forma) => (
                <option key={forma} value={forma}>
                  {FORMA_LABEL[forma]}
                </option>
              ))}
            </Select>
          </div>

          {erro && (
            <Text size="sm" tone="danger">
              {erro}
            </Text>
          )}
        </div>
        <DialogFooter>
          <Button disabled={pending || !valorPago} onClick={confirmar}>
            {pending ? "Registrando..." : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
