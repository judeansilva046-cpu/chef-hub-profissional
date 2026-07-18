"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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

import { alternarAtivoCliente } from "../actions";
import { ClienteDialog } from "./cliente-dialog";

export interface ClientesTableProps {
  clientes: Tables<"clientes">[];
}

export function ClientesTable({ clientes }: ClientesTableProps) {
  const [clienteEmEdicao, setClienteEmEdicao] = useState<
    Tables<"clientes"> | undefined
  >(undefined);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirEdicao(cliente: Tables<"clientes">) {
    setClienteEmEdicao(cliente);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(cliente: Tables<"clientes">) {
    startTransition(async () => {
      try {
        await alternarAtivoCliente(cliente.id, !cliente.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Não foi possível atualizar.",
        );
      }
    });
  }

  if (clientes.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente encontrado"
        description="Ajuste a busca/filtros ou cadastre um novo cliente."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Segmento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="text-foreground font-medium">
                <Link href={`/clientes/${cliente.id}`} className="hover:underline">
                  {cliente.nome}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.telefone ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.email ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {cliente.segmento ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={cliente.ativo ? "success" : "outline"}>
                  {cliente.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => abrirEdicao(cliente)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => alternarAtivo(cliente)}
                  >
                    <Power className="h-4 w-4" />
                    <span className="sr-only">
                      {cliente.ativo ? "Inativar" : "Reativar"}
                    </span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ClienteDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        cliente={clienteEmEdicao}
      />
    </>
  );
}
