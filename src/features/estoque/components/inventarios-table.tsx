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
import { formatarDataHora } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

export interface InventariosTableProps {
  inventarios: Tables<"estoque_inventarios">[];
}

export function InventariosTable({ inventarios }: InventariosTableProps) {
  if (inventarios.length === 0) {
    return (
      <EmptyState
        title="Nenhum inventário registrado"
        description="Crie um inventário para iniciar uma contagem física de estoque."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead>Concluído em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventarios.map((inventario) => (
          <TableRow key={inventario.id}>
            <TableCell className="text-foreground font-medium">
              <Link
                href={`/estoque/inventarios/${inventario.id}`}
                className="hover:underline"
              >
                {inventario.nome}
              </Link>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  inventario.status === "concluido" ? "success" : "warning"
                }
              >
                {inventario.status === "concluido"
                  ? "Concluído"
                  : "Em andamento"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDataHora(inventario.criado_em)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {inventario.concluido_em
                ? formatarDataHora(inventario.concluido_em)
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
