"use client";

import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";

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

import { excluirCategoriaIngrediente } from "../actions";
import { CategoriaIngredienteDialog } from "./categoria-ingrediente-dialog";

export interface CategoriasIngredientesManagerProps {
  categorias: Tables<"categorias_ingredientes">[];
}

export function CategoriasIngredientesManager({
  categorias,
}: CategoriasIngredientesManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<
    Tables<"categorias_ingredientes"> | undefined
  >(undefined);
  // Incrementado a cada abertura para remontar o CategoriaIngredienteDialog
  // (via `key`) — evita que erro de validação de uma tentativa anterior
  // vaze para a próxima abertura do diálogo.
  const [dialogKey, setDialogKey] = useState(0);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<
    Tables<"categorias_ingredientes"> | null
  >(null);

  function abrirCriacao() {
    setCategoriaEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(categoria: Tables<"categorias_ingredientes">) {
    setCategoriaEmEdicao(categoria);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {categorias.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Nenhuma categoria cadastrada"
          description="Categorias ajudam a organizar e filtrar os ingredientes."
          action={
            <Button size="sm" onClick={abrirCriacao}>
              <Plus className="h-4 w-4" />
              Nova categoria
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell className="text-foreground font-medium">
                  {categoria.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {categoria.descricao || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEdicao(categoria)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategoriaParaExcluir(categoria)}
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

      <CategoriaIngredienteDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        categoria={categoriaEmEdicao}
      />

      <ConfirmDialog
        open={categoriaParaExcluir !== null}
        onOpenChange={(open) => {
          if (!open) setCategoriaParaExcluir(null);
        }}
        title="Excluir categoria"
        description={
          categoriaParaExcluir
            ? `Excluir a categoria "${categoriaParaExcluir.nome}"?`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!categoriaParaExcluir) return;
          await excluirCategoriaIngrediente(categoriaParaExcluir.id);
          setCategoriaParaExcluir(null);
        }}
      />
    </div>
  );
}
