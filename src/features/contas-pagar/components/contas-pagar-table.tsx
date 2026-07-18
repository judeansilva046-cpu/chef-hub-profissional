"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarData, formatarMoeda } from "@/lib/format";

import { cancelarContaPagar } from "../actions";
import type { ContaPagarComRelacoes } from "../queries";
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export interface ContasPagarTableProps {
  contas: ContaPagarComRelacoes[];
}

export function ContasPagarTable({ contas }: ContasPagarTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [contaPagamento, setContaPagamento] = useState<ContaPagarComRelacoes | null>(null);
  const [contaCancelamento, setContaCancelamento] = useState<ContaPagarComRelacoes | null>(null);

  if (contas.length === 0) {
    return <EmptyState title="Nenhuma conta a pagar encontrada" description="Ajuste os filtros ou crie uma nova conta." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && <div className="text-danger text-sm">{erro}</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell className="text-foreground font-medium">{conta.descricao}</TableCell>
              <TableCell className="text-muted-foreground">{conta.fornecedores?.nome ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatarData(conta.data_vencimento)}</TableCell>
              <TableCell className="text-right font-medium">{formatarMoeda(conta.valor)}</TableCell>
              <TableCell>
                {conta.atrasada ? (
                  <Badge variant="danger">Atrasada</Badge>
                ) : (
                  <Badge
                    variant={conta.status === "pago" ? "success" : conta.status === "cancelado" ? "outline" : "warning"}
                  >
                    {STATUS_LABEL[conta.status] ?? conta.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {conta.status === "pendente" && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => setContaPagamento(conta)}>
                      Pagar
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => setContaCancelamento(conta)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {contaPagamento && (
        <RegistrarPagamentoDialog
          open={Boolean(contaPagamento)}
          onOpenChange={(open) => !open && setContaPagamento(null)}
          conta={contaPagamento}
        />
      )}

      <ConfirmDialog
        open={Boolean(contaCancelamento)}
        onOpenChange={(open) => !open && setContaCancelamento(null)}
        title="Cancelar conta a pagar"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Cancelar conta"
        destructive
        requireReason
        reasonLabel="Motivo do cancelamento"
        onConfirm={async (motivo) => {
          if (!contaCancelamento) return;
          setErro(null);
          startTransition(async () => {
            try {
              await cancelarContaPagar(contaCancelamento.id, { motivo });
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
