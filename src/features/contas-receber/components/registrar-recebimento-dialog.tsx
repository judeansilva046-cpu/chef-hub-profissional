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
import type { Tables } from "@/lib/supabase/database.types";
import { formatarMoeda } from "@/lib/format";

import { registrarRecebimentoParcela } from "../actions";
import { FORMAS_RECEBIMENTO } from "../validation";

const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
  transferencia: "Transferência",
};

export interface RegistrarRecebimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: Tables<"contas_receber_parcelas">;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RegistrarRecebimentoDialog({ open, onOpenChange, parcela }: RegistrarRecebimentoDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [valorRecebido, setValorRecebido] = useState(parcela.valor.toFixed(2));
  const [formaPagamento, setFormaPagamento] = useState<(typeof FORMAS_RECEBIMENTO)[number]>("pix");
  const [dataRecebimento, setDataRecebimento] = useState(hoje());

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        await registrarRecebimentoParcela(parcela.id, {
          valorRecebido: Number(valorRecebido),
          formaPagamento,
          dataRecebimento,
        });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível registrar o recebimento.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar recebimento</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Text tone="muted">
            Parcela {parcela.numero_parcela} — {formatarMoeda(parcela.valor)}
          </Text>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorRecebido">Valor recebido</Label>
              <Input
                id="valorRecebido"
                type="number"
                step="0.01"
                min="0"
                value={valorRecebido}
                onChange={(event) => setValorRecebido(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataRecebimento">Data do recebimento</Label>
              <Input
                id="dataRecebimento"
                type="date"
                value={dataRecebimento}
                onChange={(event) => setDataRecebimento(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="formaPagamento">Forma de recebimento</Label>
            <Select
              id="formaPagamento"
              value={formaPagamento}
              onChange={(event) => setFormaPagamento(event.target.value as (typeof FORMAS_RECEBIMENTO)[number])}
            >
              {FORMAS_RECEBIMENTO.map((forma) => (
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
          <Button disabled={pending || !valorRecebido} onClick={confirmar}>
            {pending ? "Registrando..." : "Confirmar recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
