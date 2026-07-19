"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

import { alternarAtivoFornecedor } from "../actions";
import { FornecedorDialog } from "./fornecedor-dialog";

export interface FornecedoresTableProps {
  fornecedores: Tables<"fornecedores">[];
}

export function FornecedoresTable({ fornecedores }: FornecedoresTableProps) {
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<
    Tables<"fornecedores"> | undefined
  >(undefined);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirEdicao(fornecedor: Tables<"fornecedores">) {
    setFornecedorEmEdicao(fornecedor);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(fornecedor: Tables<"fornecedores">) {
    startTransition(async () => {
      try {
        await alternarAtivoFornecedor(fornecedor.id, !fornecedor.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar.",
        );
      }
    });
  }

  if (fornecedores.length === 0) {
    return (
      <EmptyState
        title="Nenhum fornecedor encontrado"
        description="Ajuste a busca/filtros ou cadastre um novo fornecedor."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fornecedores.map((fornecedor) => (
            <TableRow key={fornecedor.id}>
              <TableCell className="text-foreground font-medium">
                <Link href={`/compras/fornecedores/${fornecedor.id}`} className="hover:underline">
                  {fornecedor.nome}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {fornecedor.documento ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {fornecedor.telefone ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {fornecedor.email ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={fornecedor.ativo ? "success" : "outline"}>
                  {fornecedor.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => abrirEdicao(fornecedor)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => alternarAtivo(fornecedor)}
                  >
                    <Power className="h-4 w-4" />
                    <span className="sr-only">
                      {fornecedor.ativo ? "Inativar" : "Reativar"}
                    </span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <FornecedorDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        fornecedor={fornecedorEmEdicao}
      />
    </>
  );
}
