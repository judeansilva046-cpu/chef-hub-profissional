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
import { Text } from "@/components/ui/text";
import { formatarDataHora, formatarMoeda } from "@/lib/format";

import { AcoesCashbackForm, EstornarCashbackButton } from "./acoes-cashback-form";
import { buscarSaldoCashbackCliente, listarExtratoCashback } from "../queries";

const TIPO_LABEL: Record<string, string> = {
  credito: "Crédito",
  resgate: "Resgate",
  estorno: "Estorno",
  expiracao: "Expiração",
};

export async function ExtratoCashbackCard({ clienteId }: { clienteId: string }) {
  const [saldo, extrato] = await Promise.all([
    buscarSaldoCashbackCliente(clienteId),
    listarExtratoCashback(clienteId),
  ]);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Cashback</CardTitle>
        <Text className="text-xl font-semibold">{formatarMoeda(saldo)}</Text>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AcoesCashbackForm clienteId={clienteId} />

        {extrato.length === 0 ? (
          <EmptyState title="Nenhuma movimentação" description="O extrato de cashback aparecerá aqui." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Saldo após</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extrato.map((linha) => (
                <TableRow key={linha.id}>
                  <TableCell className="text-muted-foreground">{formatarDataHora(linha.criado_em)}</TableCell>
                  <TableCell>{TIPO_LABEL[linha.tipo] ?? linha.tipo}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(linha.valor)}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(linha.saldo_apos)}</TableCell>
                  <TableCell className="text-muted-foreground">{linha.observacao ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {linha.tipo !== "estorno" && (
                      <EstornarCashbackButton movimentacaoId={linha.id} clienteId={clienteId} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
