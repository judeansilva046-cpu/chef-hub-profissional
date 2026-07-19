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

import type { SolicitacaoComCentroCusto } from "../queries";
import {
  PRIORIDADE_LABEL,
  PRIORIDADE_VARIANT,
  SOLICITACAO_STATUS_LABEL,
  SOLICITACAO_STATUS_VARIANT,
} from "./status-badges";

export interface SolicitacoesTableProps {
  solicitacoes: SolicitacaoComCentroCusto[];
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
          <TableHead>Número</TableHead>
          <TableHead>Criada em</TableHead>
          <TableHead>Setor / Centro de custo</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Status</TableHead>
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
                {solicitacao.numero ? `#${solicitacao.numero}` : "—"}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDataHora(solicitacao.criado_em)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {[solicitacao.setor, solicitacao.centros_custo?.nome]
                .filter(Boolean)
                .join(" · ") || "—"}
            </TableCell>
            <TableCell>
              <Badge variant={PRIORIDADE_VARIANT[solicitacao.prioridade]}>
                {PRIORIDADE_LABEL[solicitacao.prioridade] ?? solicitacao.prioridade}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={SOLICITACAO_STATUS_VARIANT[solicitacao.status]}>
                {SOLICITACAO_STATUS_LABEL[solicitacao.status] ??
                  solicitacao.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
