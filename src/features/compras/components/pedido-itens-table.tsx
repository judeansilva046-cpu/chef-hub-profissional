import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarDecimal, formatarMoeda } from "@/lib/format";

import type { PedidoItemComIngrediente } from "../queries";
import { ReceberItemDialog } from "./receber-item-dialog";

export interface PedidoItensTableProps {
  pedidoId: string;
  itens: PedidoItemComIngrediente[];
  podeReceber: boolean;
}

export function PedidoItensTable({
  pedidoId,
  itens,
  podeReceber,
}: PedidoItensTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ingrediente</TableHead>
          <TableHead>Pedido</TableHead>
          <TableHead>Recebido</TableHead>
          <TableHead>Preço unitário</TableHead>
          <TableHead className="text-right">Total</TableHead>
          {podeReceber && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {itens.map((item) => {
          const pendente = item.quantidade_pedida - item.quantidade_recebida;
          return (
            <TableRow key={item.id}>
              <TableCell className="text-foreground font-medium">
                {item.ingredientes.nome}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarDecimal(item.quantidade_pedida)}{" "}
                {item.ingredientes.unidades_medida.sigla}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarDecimal(item.quantidade_recebida)}{" "}
                {item.ingredientes.unidades_medida.sigla}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatarMoeda(item.preco_unitario)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatarMoeda(item.valor_total ?? 0)}
              </TableCell>
              {podeReceber && (
                <TableCell className="text-right">
                  {pendente > 0 && (
                    <ReceberItemDialog pedidoId={pedidoId} item={item} />
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
