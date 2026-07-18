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

import { SOLICITACAO_STATUS_LABEL, SOLICITACAO_STATUS_VARIANT } from "./status-badges";

export interface SolicitacoesTableProps {
  solicitacoes: Tables<"solicitacoes_compra">[];
}

export function SolicitacoesTable({ solicitacoes }: SolicitacoesTableProps) {
  if (solicitacoes.length === 0) {
    return (
      <EmptyState
        title="Nenhuma solicitação encontrada"
        description="Ajuste os filtros ou crie uma nova solicitação de compra."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criada em</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Observação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {solicitacoes.map((solicitacao) => (
          <TableRow key={solicitacao.id}>
            <TableCell className="text-foreground font-medium">
              <Link
                href={`/compras/solicitacoes/${solicitacao.id}`}
                className="hover:underline"
              >
                {formatarDataHora(solicitacao.criado_em)}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={SOLICITACAO_STATUS_VARIANT[solicitacao.status]}>
                {SOLICITACAO_STATUS_LABEL[solicitacao.status] ??
                  solicitacao.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground max-w-md truncate">
              {solicitacao.observacao ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
