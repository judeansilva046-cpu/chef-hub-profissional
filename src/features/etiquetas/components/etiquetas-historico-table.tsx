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

import type { EtiquetaComRelacoes } from "../queries";

export interface EtiquetasHistoricoTableProps {
  etiquetas: EtiquetaComRelacoes[];
}

const TAMANHO_LABEL: Record<string, string> = {
  "50x30": "50 × 30 mm",
  "60x40": "60 × 40 mm",
};

export function EtiquetasHistoricoTable({ etiquetas }: EtiquetasHistoricoTableProps) {
  if (etiquetas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma etiqueta emitida"
        description="Emita a primeira etiqueta a partir de um lote com validade."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Lote</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Qtd.</TableHead>
          <TableHead className="text-right">Emitido em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {etiquetas.map((etiqueta) => (
          <TableRow key={etiqueta.id}>
            <TableCell className="text-muted-foreground font-mono text-xs">
              {etiqueta.codigo_interno}
            </TableCell>
            <TableCell className="text-foreground font-medium">
              {etiqueta.estoque_lotes?.ingredientes.nome ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {etiqueta.estoque_lotes?.numero_lote ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{TAMANHO_LABEL[etiqueta.tamanho] ?? etiqueta.tamanho}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {etiqueta.quantidade_etiquetas}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatarDataHora(etiqueta.emitido_em)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
