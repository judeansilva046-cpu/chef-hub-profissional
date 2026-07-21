"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarData, formatarDecimal, formatarMoeda } from "@/lib/format";

import type { FichaTecnicaParaFinanceiro } from "@/features/financeiro/queries";

import { excluirVenda } from "../actions";
import type { VendaComRelacoes } from "../queries";
import { VendaDialog } from "./venda-dialog";

export interface VendasTableProps {
  vendas: VendaComRelacoes[];
  fichas: FichaTecnicaParaFinanceiro[];
  canais: Tables<"canais_venda">[];
  clientes: Tables<"clientes">[];
}

export function VendasTable({ vendas, fichas, canais, clientes }: VendasTableProps) {
  const [vendaEmEdicao, setVendaEmEdicao] = useState<VendaComRelacoes | undefined>(
    undefined,
  );
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [vendaParaExcluir, setVendaParaExcluir] = useState<VendaComRelacoes | null>(null);

  function abrirEdicao(venda: VendaComRelacoes) {
    setVendaEmEdicao(venda);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  if (vendas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma venda registrada"
        description="Ajuste os filtros ou registre uma nova venda."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Ficha técnica</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Margem</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendas.map((venda) => (
            <TableRow key={venda.id}>
              <TableCell className="text-muted-foreground">
                {formatarData(venda.data_venda)}
              </TableCell>
              <TableCell className="text-foreground font-medium">
                {venda.fichas_tecnicas.nome}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {venda.canais_venda?.nome ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {venda.clientes?.nome ?? "—"}
              </TableCell>
              <TableCell>{formatarDecimal(venda.quantidade)}</TableCell>
              <TableCell className="text-muted-foreground">
                {venda.margem_total !== null ? formatarMoeda(venda.margem_total) : "—"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {venda.valor_total !== null ? formatarMoeda(venda.valor_total) : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirEdicao(venda)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVendaParaExcluir(venda)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <VendaDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        fichas={fichas}
        canais={canais}
        clientes={clientes}
        venda={vendaEmEdicao}
      />

      <ConfirmDialog
        open={vendaParaExcluir !== null}
        onOpenChange={(open) => {
          if (!open) setVendaParaExcluir(null);
        }}
        title="Excluir venda"
        description={
          vendaParaExcluir
            ? `Excluir a venda de "${vendaParaExcluir.fichas_tecnicas.nome}"?`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!vendaParaExcluir) return;
          await excluirVenda(vendaParaExcluir.id);
          setVendaParaExcluir(null);
        }}
      />
    </>
  );
}
