"use client";

import { useState, useTransition } from "react";
import { Pencil, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { alternarAtivoIngrediente } from "../actions";
import type { IngredienteComRelacoes } from "../queries";
import { IngredienteDialog } from "./ingrediente-dialog";

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export interface IngredientesTableProps {
  ingredientes: IngredienteComRelacoes[];
  categorias: Tables<"categorias_ingredientes">[];
  unidades: Tables<"unidades_medida">[];
}

export function IngredientesTable({
  ingredientes,
  categorias,
  unidades,
}: IngredientesTableProps) {
  const [ingredienteEmEdicao, setIngredienteEmEdicao] = useState<
    IngredienteComRelacoes | undefined
  >(undefined);
  const [dialogAberto, setDialogAberto] = useState(false);
  // Incrementado a cada abertura para forçar remount do IngredienteDialog
  // (via `key`) — garante que o campo de custo comece do valor certo mesmo
  // reabrindo o mesmo ingrediente após um cancelamento.
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirEdicao(ingrediente: IngredienteComRelacoes) {
    setIngredienteEmEdicao(ingrediente);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(ingrediente: IngredienteComRelacoes) {
    startTransition(async () => {
      try {
        await alternarAtivoIngrediente(ingrediente.id, !ingrediente.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar.",
        );
      }
    });
  }

  if (ingredientes.length === 0) {
    return (
      <EmptyState
        title="Nenhum ingrediente encontrado"
        description="Ajuste a busca/filtros ou cadastre um novo ingrediente."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Custo unitário</TableHead>
            <TableHead>Estoque mínimo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredientes.map((ingrediente) => (
            <TableRow key={ingrediente.id}>
              <TableCell className="text-foreground font-medium">
                {ingrediente.nome}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ingrediente.categorias_ingredientes?.nome ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ingrediente.unidades_medida.sigla}
              </TableCell>
              <TableCell>
                {formatoMoeda.format(ingrediente.custo_unitario_atual)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ingrediente.estoque_minimo} {ingrediente.unidades_medida.sigla}
              </TableCell>
              <TableCell>
                <Badge variant={ingrediente.ativo ? "success" : "outline"}>
                  {ingrediente.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => abrirEdicao(ingrediente)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => alternarAtivo(ingrediente)}
                  >
                    <Power className="h-4 w-4" />
                    <span className="sr-only">
                      {ingrediente.ativo ? "Inativar" : "Reativar"}
                    </span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <IngredienteDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        ingrediente={ingredienteEmEdicao}
        categorias={categorias}
        unidades={unidades}
      />
    </>
  );
}
