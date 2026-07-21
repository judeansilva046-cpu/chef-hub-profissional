"use client";

import { useState } from "react";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";

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
import { formatarDecimal, formatarMesAno, formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { excluirMetaVendas } from "../actions";
import { MetaVendasDialog } from "./meta-vendas-dialog";

export interface MetasVendasManagerProps {
  metas: Tables<"metas_vendas">[];
}

export function MetasVendasManager({ metas }: MetasVendasManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState<
    Tables<"metas_vendas"> | undefined
  >(undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const [metaParaExcluir, setMetaParaExcluir] = useState<Tables<"metas_vendas"> | null>(null);

  function abrirCriacao() {
    setMetaEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(meta: Tables<"metas_vendas">) {
    setMetaEmEdicao(meta);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Nova meta
        </Button>
      </div>

      {metas.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta de vendas cadastrada"
          description="Defina uma meta de faturamento mensal para acompanhar no Painel."
          action={
            <Button size="sm" onClick={abrirCriacao}>
              <Plus className="h-4 w-4" />
              Nova meta
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Meta de faturamento</TableHead>
              <TableHead>Quantidade de vendas</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metas.map((meta) => (
              <TableRow key={meta.id}>
                <TableCell className="text-foreground font-medium">
                  {formatarMesAno(meta.mes_referencia)}
                </TableCell>
                <TableCell>{formatarMoeda(meta.valor_meta_receita)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {meta.quantidade_meta !== null
                    ? formatarDecimal(meta.quantidade_meta)
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {meta.observacao ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEdicao(meta)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMetaParaExcluir(meta)}
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
      )}

      <MetaVendasDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        meta={metaEmEdicao}
      />

      <ConfirmDialog
        open={metaParaExcluir !== null}
        onOpenChange={(open) => {
          if (!open) setMetaParaExcluir(null);
        }}
        title="Excluir meta"
        description={
          metaParaExcluir
            ? `Excluir a meta de ${formatarMesAno(metaParaExcluir.mes_referencia)}?`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!metaParaExcluir) return;
          await excluirMetaVendas(metaParaExcluir.id);
          setMetaParaExcluir(null);
        }}
      />
    </div>
  );
}
