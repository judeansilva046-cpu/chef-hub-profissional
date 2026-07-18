import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarDataHora, formatarMoeda } from "@/lib/format";

import type { CaixaComOperador } from "../queries";

export interface CaixasTableProps {
  caixas: CaixaComOperador[];
}

export function CaixasTable({ caixas }: CaixasTableProps) {
  if (caixas.length === 0) {
    return <EmptyState title="Nenhum caixa no histórico" description="Abra um caixa para começar." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Operador</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aberto em</TableHead>
          <TableHead>Fechado em</TableHead>
          <TableHead className="text-right">Diferença</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {caixas.map((caixa) => (
          <TableRow key={caixa.id}>
            <TableCell className="text-foreground font-medium">
              <Link href={`/caixa/${caixa.id}`} className="hover:underline">
                {caixa.profiles?.nome_completo ?? "—"}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={caixa.status === "aberto" ? "success" : "outline"}>
                {caixa.status === "aberto" ? "Aberto" : "Fechado"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatarDataHora(caixa.aberto_em)}</TableCell>
            <TableCell className="text-muted-foreground">
              {caixa.fechado_em ? formatarDataHora(caixa.fechado_em) : "—"}
            </TableCell>
            <TableCell className="text-right">
              {caixa.diferenca !== null ? formatarMoeda(caixa.diferenca) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
