"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarData, formatarMoeda } from "@/lib/format";

import { cancelarContaReceber } from "../actions";
import type { ContaReceberComRelacoes } from "../queries";
import { RegistrarRecebimentoDialog } from "./registrar-recebimento-dialog";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  recebido_parcial: "Parcialmente recebido",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

const STATUS_VARIANT: Record<string, "warning" | "success" | "outline" | "info"> = {
  pendente: "warning",
  recebido_parcial: "info",
  recebido: "success",
  cancelado: "outline",
};

export interface ContasReceberTableProps {
  contas: ContaReceberComRelacoes[];
}

export function ContasReceberTable({ contas }: ContasReceberTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [parcelaRecebimento, setParcelaRecebimento] = useState<Tables<"contas_receber_parcelas"> | null>(null);
  const [contaCancelamento, setContaCancelamento] = useState<ContaReceberComRelacoes | null>(null);

  if (contas.length === 0) {
    return <EmptyState title="Nenhuma conta a receber encontrada" description="Ajuste os filtros ou crie uma nova conta." />;
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      {erro && <div className="text-danger text-sm">{erro}</div>}
      {contas.map((conta) => (
        <div key={conta.id} className="border-border flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Text weight="medium">{conta.descricao}</Text>
              <Text size="sm" tone="muted">
                {conta.clientes?.nome ?? "Sem cliente"} · {formatarMoeda(conta.valor_total)} em {conta.numero_parcelas}x
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[conta.status] ?? "outline"}>{STATUS_LABEL[conta.status] ?? conta.status}</Badge>
              {conta.status !== "recebido" && conta.status !== "cancelado" && (
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => setContaCancelamento(conta)}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 pl-2">
            {conta.contas_receber_parcelas
              .sort((a, b) => a.numero_parcela - b.numero_parcela)
              .map((parcela) => {
                const atrasada = parcela.status === "pendente" && parcela.data_vencimento < hoje;
                return (
                  <div key={parcela.id} className="flex items-center justify-between text-sm">
                    <Text size="sm" tone="muted">
                      Parcela {parcela.numero_parcela} — vence {formatarData(parcela.data_vencimento)}
                    </Text>
                    <div className="flex items-center gap-2">
                      {atrasada ? (
                        <Badge variant="danger">Atrasada</Badge>
                      ) : (
                        <Badge variant={parcela.status === "recebido" ? "success" : "outline"}>
                          {parcela.status === "recebido" ? "Recebida" : parcela.status === "cancelado" ? "Cancelada" : "Pendente"}
                        </Badge>
                      )}
                      <Text size="sm">{formatarMoeda(parcela.valor)}</Text>
                      {parcela.status === "pendente" && (
                        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setParcelaRecebimento(parcela)}>
                          Receber
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {parcelaRecebimento && (
        <RegistrarRecebimentoDialog
          open={Boolean(parcelaRecebimento)}
          onOpenChange={(open) => !open && setParcelaRecebimento(null)}
          parcela={parcelaRecebimento}
        />
      )}

      <ConfirmDialog
        open={Boolean(contaCancelamento)}
        onOpenChange={(open) => !open && setContaCancelamento(null)}
        title="Cancelar conta a receber"
        description="Cancela todas as parcelas pendentes. Parcelas já recebidas não são afetadas."
        confirmLabel="Cancelar conta"
        destructive
        requireReason
        reasonLabel="Motivo do cancelamento"
        onConfirm={async (motivo) => {
          if (!contaCancelamento) return;
          setErro(null);
          startTransition(async () => {
            try {
              await cancelarContaReceber(contaCancelamento.id, { motivo });
              router.refresh();
            } catch (error) {
              setErro(error instanceof Error ? error.message : "Não foi possível cancelar.");
            }
          });
        }}
      />
    </div>
  );
}
