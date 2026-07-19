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

import { COTACAO_STATUS_LABEL, COTACAO_STATUS_VARIANT } from "./status-badges";

export interface CotacoesTableProps {
  cotacoes: Tables<"compras_cotacoes">[];
}

export function CotacoesTable({ cotacoes }: CotacoesTableProps) {
  if (cotacoes.length === 0) {
    return (
      <EmptyState
        title="Nenhuma cotação encontrada"
        description="Ajuste os filtros ou crie uma nova cotação."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Criada em</TableHead>
          <TableHead>Observação</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cotacoes.map((cotacao) => (
          <TableRow key={cotacao.id}>
            <TableCell className="text-foreground font-medium">
              <Link href={`/compras/cotacoes/${cotacao.id}`} className="hover:underline">
                {cotacao.numero ? `#${cotacao.numero}` : "—"}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDataHora(cotacao.criado_em)}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {cotacao.observacao ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant={COTACAO_STATUS_VARIANT[cotacao.status]}>
                {COTACAO_STATUS_LABEL[cotacao.status] ?? cotacao.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
