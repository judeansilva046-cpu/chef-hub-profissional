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
import { formatarData, formatarDecimal, formatarMoeda } from "@/lib/format";

import type { LoteComIngrediente } from "../queries";

function statusValidade(dataValidade: string | null): {
  label: string;
  variant: "success" | "warning" | "danger" | "outline";
} | null {
  if (!dataValidade) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [year, month, day] = dataValidade.split("-").map(Number);
  const validade = new Date(year, month - 1, day);
  const diasRestantes = Math.round(
    (validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diasRestantes < 0) return { label: "Vencido", variant: "danger" };
  if (diasRestantes <= 7)
    return { label: `Vence em ${diasRestantes}d`, variant: "warning" };
  return { label: "Dentro da validade", variant: "outline" };
}

export interface LotesTableProps {
  lotes: LoteComIngrediente[];
}

export function LotesTable({ lotes }: LotesTableProps) {
  if (lotes.length === 0) {
    return (
      <EmptyState
        title="Nenhum lote ativo encontrado"
        description="Registre uma entrada de estoque para criar o primeiro lote."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ingrediente</TableHead>
          <TableHead>Lote</TableHead>
          <TableHead>Entrada</TableHead>
          <TableHead>Saldo do lote</TableHead>
          <TableHead>Custo unitário</TableHead>
          <TableHead>Validade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lotes.map((lote) => {
          const status = statusValidade(lote.data_validade);
          return (
            <TableRow key={lote.id}>
              <TableCell className="text-foreground font-medium">
                {lote.ingredientes.nome}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lote.numero_lote ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarData(lote.data_entrada)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarDecimal(lote.quantidade_atual)}{" "}
                {lote.ingredientes.unidades_medida.sigla}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarMoeda(lote.custo_unitario)}
              </TableCell>
              <TableCell>
                {status ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {formatarData(lote.data_validade!)}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
