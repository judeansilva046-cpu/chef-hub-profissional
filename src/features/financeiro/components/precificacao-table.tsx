import Link from "next/link";
import { AlertTriangle } from "lucide-react";

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
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

import type { MargemContribuicaoReal } from "../calculations";

export interface LinhaPrecificacao {
  id: string;
  nome: string;
  custoPorPorcao: number;
  precoReferencia: number | null;
  margem: MargemContribuicaoReal | null;
  custoDesatualizado: boolean;
}

export interface PrecificacaoTableProps {
  linhas: LinhaPrecificacao[];
  margemNecessariaPercentual: number | null;
}

function statusMargem(
  margem: MargemContribuicaoReal | null,
  margemNecessariaPercentual: number | null,
): { label: string; variant: "success" | "warning" | "danger" | "outline" } {
  if (!margem) return { label: "Sem preço definido", variant: "outline" };
  if (margem.margemUnitaria <= 0) return { label: "No vermelho", variant: "danger" };
  if (
    margemNecessariaPercentual !== null &&
    margem.margemPercentual < margemNecessariaPercentual
  ) {
    return { label: "Abaixo do necessário", variant: "warning" };
  }
  return { label: "Saudável", variant: "success" };
}

export function PrecificacaoTable({
  linhas,
  margemNecessariaPercentual,
}: PrecificacaoTableProps) {
  if (linhas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma ficha técnica ativa"
        description="Cadastre fichas técnicas para ver a análise de precificação."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ficha técnica</TableHead>
          <TableHead>Custo direto</TableHead>
          <TableHead>Custo variável</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead>Margem de contribuição real</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => {
          const status = statusMargem(linha.margem, margemNecessariaPercentual);
          return (
            <TableRow key={linha.id}>
              <TableCell className="text-foreground font-medium">
                <div className="flex items-center gap-2">
                  {linha.nome}
                  {linha.custoDesatualizado && (
                    <span title="O custo de algum ingrediente mudou desde que esta ficha foi salva.">
                      <AlertTriangle className="text-warning h-4 w-4" />
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarMoeda(linha.custoPorPorcao)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {linha.margem ? formatarMoeda(linha.margem.custoVariavelValor) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {linha.precoReferencia !== null
                  ? formatarMoeda(linha.precoReferencia)
                  : "—"}
              </TableCell>
              <TableCell>
                {linha.margem ? (
                  <Text size="sm" weight="medium">
                    {formatarMoeda(linha.margem.margemUnitaria)} (
                    {formatarPercentual(linha.margem.margemPercentual)})
                  </Text>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/fichas-tecnicas/${linha.id}/editar`}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Editar preço
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
