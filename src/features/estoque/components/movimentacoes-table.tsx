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
import { formatarDataHora, formatarDecimal, formatarMoeda } from "@/lib/format";

import type { MovimentacaoComIngrediente } from "../queries";

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste_entrada: "Ajuste (+)",
  ajuste_saida: "Ajuste (-)",
  inventario: "Inventário",
};

const TIPO_VARIANT: Record<
  string,
  "success" | "danger" | "info" | "warning"
> = {
  entrada: "success",
  saida: "danger",
  ajuste_entrada: "info",
  ajuste_saida: "warning",
  inventario: "info",
};

export interface MovimentacoesTableProps {
  movimentacoes: MovimentacaoComIngrediente[];
}

export function MovimentacoesTable({
  movimentacoes,
}: MovimentacoesTableProps) {
  if (movimentacoes.length === 0) {
    return (
      <EmptyState
        title="Nenhuma movimentação encontrada"
        description="Ajuste os filtros ou registre uma nova movimentação."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Ingrediente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Custo unitário</TableHead>
          <TableHead>Observação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimentacoes.map((movimentacao) => (
          <TableRow key={movimentacao.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {formatarDataHora(movimentacao.criado_em)}
            </TableCell>
            <TableCell className="text-foreground font-medium">
              {movimentacao.ingredientes.nome}
            </TableCell>
            <TableCell>
              <Badge variant={TIPO_VARIANT[movimentacao.tipo] ?? "info"}>
                {TIPO_LABEL[movimentacao.tipo] ?? movimentacao.tipo}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(movimentacao.quantidade)}{" "}
              {movimentacao.ingredientes.unidades_medida.sigla}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarMoeda(movimentacao.custo_unitario)}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">
              {movimentacao.observacao ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
