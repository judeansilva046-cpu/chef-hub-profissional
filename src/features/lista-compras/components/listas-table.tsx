import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarData, formatarDataHora } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

export interface ListasTableProps {
  listas: Tables<"listas_compra">[];
}

export function ListasTable({ listas }: ListasTableProps) {
  if (listas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma lista de compras gerada"
        description="Gere uma lista inteligente a partir do planejamento de produção."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Período de referência</TableHead>
          <TableHead>Gerada em</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listas.map((lista) => (
          <TableRow key={lista.id}>
            <TableCell className="text-foreground font-medium">
              <Link
                href={`/lista-compras/${lista.id}`}
                className="hover:underline"
              >
                {lista.nome}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarData(lista.data_inicio_referencia)} a{" "}
              {formatarData(lista.data_fim_referencia)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDataHora(lista.criado_em)}
            </TableCell>
            <TableCell>
              <Badge variant={lista.status === "convertida" ? "success" : "info"}>
                {lista.status === "convertida" ? "Convertida em pedidos" : "Gerada"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
