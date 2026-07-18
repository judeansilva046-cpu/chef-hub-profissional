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
import { formatarDecimal, formatarMoeda } from "@/lib/format";

import type { SaldoEstoqueItem } from "../queries";

export interface SaldoEstoqueTableProps {
  saldos: SaldoEstoqueItem[];
}

export function SaldoEstoqueTable({ saldos }: SaldoEstoqueTableProps) {
  if (saldos.length === 0) {
    return (
      <EmptyState
        title="Nenhum ingrediente ativo"
        description="Cadastre ingredientes para acompanhar o estoque."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ingrediente</TableHead>
          <TableHead>Saldo atual</TableHead>
          <TableHead>Estoque mínimo</TableHead>
          <TableHead>Custo médio ponderado</TableHead>
          <TableHead className="text-right">Valor em estoque</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {saldos.map((item) => (
          <TableRow key={item.ingrediente.id}>
            <TableCell className="text-foreground font-medium">
              {item.ingrediente.nome}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(item.quantidadeAtual)}{" "}
              {item.ingrediente.unidades_medida.sigla}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(item.ingrediente.estoque_minimo)}{" "}
              {item.ingrediente.unidades_medida.sigla}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarMoeda(item.custoMedioPonderado)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatarMoeda(item.valorEmEstoque)}
            </TableCell>
            <TableCell>
              <Badge variant={item.abaixoDoMinimo ? "danger" : "success"}>
                {item.abaixoDoMinimo ? "Abaixo do mínimo" : "Normal"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
