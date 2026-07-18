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
import { formatarDecimal } from "@/lib/format";

import type { ConsumoPrevistoItem } from "../queries";

export interface ConsumoPrevistoTableProps {
  itens: ConsumoPrevistoItem[];
}

export function ConsumoPrevistoTable({ itens }: ConsumoPrevistoTableProps) {
  if (itens.length === 0) {
    return (
      <EmptyState
        title="Nenhum consumo previsto"
        description="Planeje produções no período para ver o consumo de ingredientes."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ingrediente</TableHead>
          <TableHead>Consumo previsto</TableHead>
          <TableHead>Estoque atual</TableHead>
          <TableHead>Estoque mínimo</TableHead>
          <TableHead>Necessidade de compra</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((item) => (
          <TableRow key={item.ingredienteId}>
            <TableCell className="text-foreground font-medium">
              {item.ingredienteNome}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(item.consumoPrevisto)} {item.unidadeSigla}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(item.estoqueAtual)} {item.unidadeSigla}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(item.estoqueMinimo)} {item.unidadeSigla}
            </TableCell>
            <TableCell>
              {item.necessidadeCompra > 0 ? (
                <Badge variant="warning">
                  {formatarDecimal(item.necessidadeCompra)} {item.unidadeSigla}
                </Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
