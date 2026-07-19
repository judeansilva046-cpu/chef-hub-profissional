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
import { formatarData, formatarMoeda } from "@/lib/format";

import type { PedidoComFornecedor } from "../queries";
import { PEDIDO_STATUS_LABEL, PEDIDO_STATUS_VARIANT } from "./status-badges";

export interface PedidosTableProps {
  pedidos: PedidoComFornecedor[];
}

export function PedidosTable({ pedidos }: PedidosTableProps) {
  if (pedidos.length === 0) {
    return (
      <EmptyState
        title="Nenhum pedido de compra encontrado"
        description="Ajuste os filtros ou crie um novo pedido."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Data do pedido</TableHead>
          <TableHead>Previsão de entrega</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => (
          <TableRow key={pedido.id}>
            <TableCell className="text-foreground font-medium">
              <Link
                href={`/compras/pedidos/${pedido.id}`}
                className="hover:underline"
              >
                {pedido.numero ? `#${pedido.numero}` : "—"}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{pedido.fornecedores.nome}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatarData(pedido.data_pedido)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {pedido.data_prevista_entrega
                ? formatarData(pedido.data_prevista_entrega)
                : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground text-right">
              {formatarMoeda(pedido.total)}
            </TableCell>
            <TableCell>
              <Badge variant={PEDIDO_STATUS_VARIANT[pedido.status]}>
                {PEDIDO_STATUS_LABEL[pedido.status] ?? pedido.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
