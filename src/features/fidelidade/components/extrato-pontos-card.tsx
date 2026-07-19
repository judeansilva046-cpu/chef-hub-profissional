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
import { formatarDataHora, formatarDecimal } from "@/lib/format";

import { AcoesPontosForm, EstornarMovimentacaoButton } from "./acoes-pontos-form";
import { buscarSaldoPontosCliente, listarExtratoPontos } from "../queries";

const TIPO_LABEL: Record<string, string> = {
  ganho: "Ganho",
  resgate: "Resgate",
  estorno: "Estorno",
  expiracao: "Expiração",
};

export async function ExtratoPontosCard({ clienteId }: { clienteId: string }) {
  const [saldo, extrato] = await Promise.all([
    buscarSaldoPontosCliente(clienteId),
    listarExtratoPontos(clienteId),
  ]);

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Fidelidade — pontos</CardTitle>
        <Text className="text-xl font-semibold">{formatarDecimal(saldo)} pts</Text>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AcoesPontosForm clienteId={clienteId} />

        {extrato.length === 0 ? (
          <EmptyState title="Nenhuma movimentação" description="O extrato de pontos aparecerá aqui." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
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
                  <TableCell className="text-right">{formatarDecimal(linha.pontos)}</TableCell>
                  <TableCell className="text-right">{formatarDecimal(linha.saldo_apos)}</TableCell>
                  <TableCell className="text-muted-foreground">{linha.observacao ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {linha.tipo !== "estorno" && (
                      <EstornarMovimentacaoButton movimentacaoId={linha.id} clienteId={clienteId} />
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
