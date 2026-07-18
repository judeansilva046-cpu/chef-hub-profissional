import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarDecimal, formatarMoeda, formatarPercentual } from "@/lib/format";

import type { ComparativoCanal } from "../calculations";

export interface DashboardComparativoCanalProps {
  porCanal: ComparativoCanal[];
  nomesPorCanal: Map<string, string>;
}

export function DashboardComparativoCanal({
  porCanal,
  nomesPorCanal,
}: DashboardComparativoCanalProps) {
  if (porCanal.length === 0) {
    return (
      <EmptyState
        title="Sem vendas no período"
        description="Registre vendas com um canal para ver o comparativo."
      />
    );
  }

  const faturamentoTotal = porCanal.reduce((total, linha) => total + linha.faturamento, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Canal</TableHead>
          <TableHead>Qtd. vendida</TableHead>
          <TableHead>Faturamento</TableHead>
          <TableHead>Margem</TableHead>
          <TableHead className="text-right">% do faturamento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {porCanal.map((linha) => (
          <TableRow key={linha.canalVendaId ?? "sem-canal"}>
            <TableCell className="text-foreground font-medium">
              {linha.canalVendaId ? (nomesPorCanal.get(linha.canalVendaId) ?? "—") : "Sem canal"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(linha.quantidadeVendida)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarMoeda(linha.faturamento)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarMoeda(linha.margem)}
            </TableCell>
            <TableCell className="text-right">
              {faturamentoTotal > 0
                ? formatarPercentual((linha.faturamento / faturamentoTotal) * 100)
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
