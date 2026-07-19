import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import { listarUsosCupom } from "../queries";

export async function UsosCupomCard({ cupomId, codigo }: { cupomId: string; codigo: string }) {
  const usos = await listarUsosCupom(cupomId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usos do cupom {codigo}</CardTitle>
      </CardHeader>
      <CardContent>
        {usos.length === 0 ? (
          <EmptyState title="Nenhum uso registrado" description="Os usos deste cupom aparecerão aqui." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Valor da compra</TableHead>
                <TableHead className="text-right">Desconto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usos.map((uso) => (
                <TableRow key={uso.id}>
                  <TableCell className="text-muted-foreground">{formatarData(uso.criadoEm)}</TableCell>
                  <TableCell className="text-foreground font-medium">{uso.clienteNome}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(uso.valorCompra)}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(uso.valorDesconto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
