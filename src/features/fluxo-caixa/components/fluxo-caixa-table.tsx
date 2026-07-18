import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatarMesAno, formatarMoeda } from "@/lib/format";

import type { FluxoCaixaMes } from "../calculations";

export interface FluxoCaixaTableProps {
  linhas: FluxoCaixaMes[];
}

export function FluxoCaixaTable({ linhas }: FluxoCaixaTableProps) {
  if (linhas.length === 0) {
    return <EmptyState title="Nenhuma movimentação no período" description="Ajuste o período ou registre movimentações de caixa/contas." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mês</TableHead>
          <TableHead className="text-right">Entradas realizadas</TableHead>
          <TableHead className="text-right">Saídas realizadas</TableHead>
          <TableHead className="text-right">Saldo realizado</TableHead>
          <TableHead className="text-right">Entradas projetadas</TableHead>
          <TableHead className="text-right">Saídas projetadas</TableHead>
          <TableHead className="text-right">Saldo projetado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => (
          <TableRow key={linha.mes}>
            <TableCell className="text-foreground font-medium">{formatarMesAno(`${linha.mes}-01`)}</TableCell>
            <TableCell className="text-right text-success">{formatarMoeda(linha.entradasRealizadas)}</TableCell>
            <TableCell className="text-right text-danger">{formatarMoeda(linha.saidasRealizadas)}</TableCell>
            <TableCell className="text-right font-medium">{formatarMoeda(linha.saldoRealizado)}</TableCell>
            <TableCell className="text-muted-foreground text-right">{formatarMoeda(linha.entradasProjetadas)}</TableCell>
            <TableCell className="text-muted-foreground text-right">{formatarMoeda(linha.saidasProjetadas)}</TableCell>
            <TableCell className="text-right font-medium">{formatarMoeda(linha.saldoProjetado)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
