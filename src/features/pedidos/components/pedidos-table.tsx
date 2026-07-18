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
import { formatarDataHora, formatarMoeda } from "@/lib/format";

import type { PedidoComRelacoes } from "../queries";
import { STATUS_PEDIDO_LABEL, STATUS_PEDIDO_VARIANT, TIPO_PEDIDO_LABEL } from "../status";

export interface PedidosTableProps {
  pedidos: PedidoComRelacoes[];
}

export function PedidosTable({ pedidos }: PedidosTableProps) {
  if (pedidos.length === 0) {
    return (
      <EmptyState
        title="Nenhum pedido encontrado"
        description="Ajuste os filtros ou registre um novo pedido."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => (
          <TableRow key={pedido.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">
              <Link href={`/pedidos/${pedido.id}`} className="hover:underline">
                #{pedido.numero}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{TIPO_PEDIDO_LABEL[pedido.tipo] ?? pedido.tipo}</TableCell>
            <TableCell className="text-muted-foreground">{pedido.clientes?.nome ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{pedido.canais_venda?.nome ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={STATUS_PEDIDO_VARIANT[pedido.status] ?? "outline"}>
                {STATUS_PEDIDO_LABEL[pedido.status] ?? pedido.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatarDataHora(pedido.criado_em)}</TableCell>
            <TableCell className="text-right font-medium">{formatarMoeda(pedido.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
