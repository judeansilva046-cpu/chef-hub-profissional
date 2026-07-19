"use client";

import { useTransition } from "react";
import Link from "next/link";

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
import { formatarDataHora } from "@/lib/format";

import { marcarReclamacaoResolvida } from "../actions";
import type { ReclamacaoComCliente } from "../queries";

export function ReclamacoesTable({ reclamacoes }: { reclamacoes: ReclamacaoComCliente[] }) {
  const [pending, startTransition] = useTransition();

  if (reclamacoes.length === 0) {
    return <EmptyState title="Nenhuma reclamação registrada" description="Reclamações registradas no perfil do cliente aparecerão aqui." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Assunto</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reclamacoes.map((reclamacao) => (
          <TableRow key={reclamacao.id}>
            <TableCell className="text-muted-foreground">{formatarDataHora(reclamacao.criadoEm)}</TableCell>
            <TableCell className="text-foreground font-medium">
              <Link href={`/clientes/${reclamacao.clienteId}`} className="hover:underline">
                {reclamacao.clienteNome}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{reclamacao.assunto ?? reclamacao.conteudo ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={reclamacao.resolvida ? "success" : "warning"}>
                {reclamacao.resolvida ? "Resolvida" : "Pendente"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(() => marcarReclamacaoResolvida(reclamacao.id, !reclamacao.resolvida))
                }
              >
                {reclamacao.resolvida ? "Reabrir" : "Marcar resolvida"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
