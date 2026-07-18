"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { marcarContaPagarConciliada } from "@/features/contas-pagar/actions";
import { marcarParcelaConciliada } from "@/features/contas-receber/actions";
import { formatarData, formatarMoeda } from "@/lib/format";

import type { ContaPagarParaConciliar, ParcelaParaConciliar } from "../queries";

export interface ConciliacaoListasProps {
  contasPagar: ContaPagarParaConciliar[];
  parcelas: ParcelaParaConciliar[];
}

export function ConciliacaoListas({ contasPagar, parcelas }: ConciliacaoListasProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function conciliarPagar(id: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await marcarContaPagarConciliada(id, true);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível conciliar.");
      }
    });
  }

  function conciliarReceber(id: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await marcarParcelaConciliada(id, true);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível conciliar.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {erro && <div className="text-danger text-sm lg:col-span-2">{erro}</div>}

      <div className="flex flex-col gap-3">
        <Text weight="medium">Contas a pagar quitadas</Text>
        {contasPagar.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Tudo conciliado" description="Nenhuma conta paga pendente de conciliação." />
        ) : (
          contasPagar.map((conta) => (
            <div key={conta.id} className="border-border flex items-center justify-between rounded-lg border p-3">
              <div>
                <Text size="sm" weight="medium">
                  {conta.descricao}
                </Text>
                <Text size="sm" tone="muted">
                  {conta.fornecedores?.nome ?? "Sem fornecedor"} · {conta.data_pagamento ? formatarData(conta.data_pagamento) : "—"} ·{" "}
                  {formatarMoeda(conta.valor_pago ?? conta.valor)}
                </Text>
              </div>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => conciliarPagar(conta.id)}>
                Conciliar
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Text weight="medium">Recebimentos</Text>
        {parcelas.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Tudo conciliado" description="Nenhum recebimento pendente de conciliação." />
        ) : (
          parcelas.map((parcela) => (
            <div key={parcela.id} className="border-border flex items-center justify-between rounded-lg border p-3">
              <div>
                <Text size="sm" weight="medium">
                  {parcela.contas_receber?.descricao ?? "—"} (parcela {parcela.numero_parcela})
                </Text>
                <Text size="sm" tone="muted">
                  {parcela.data_recebimento ? formatarData(parcela.data_recebimento) : "—"} ·{" "}
                  {formatarMoeda(parcela.valor_recebido ?? parcela.valor)}
                </Text>
              </div>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => conciliarReceber(parcela.id)}>
                Conciliar
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
