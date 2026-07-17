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
import { formatarDecimal, formatarMoeda } from "@/lib/format";

import type { RentabilidadeProduto } from "../calculations";

export interface DashboardProdutosRentaveisProps {
  porProduto: RentabilidadeProduto[];
  nomesPorFicha: Map<string, string>;
}

function TabelaProdutos({
  linhas,
  nomesPorFicha,
}: {
  linhas: RentabilidadeProduto[];
  nomesPorFicha: Map<string, string>;
}) {
  if (linhas.length === 0) {
    return (
      <EmptyState
        title="Sem vendas no período"
        description="Registre vendas para ver os produtos mais/menos rentáveis."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Qtd. vendida</TableHead>
          <TableHead>Faturamento</TableHead>
          <TableHead className="text-right">Margem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => (
          <TableRow key={linha.fichaTecnicaId}>
            <TableCell className="text-foreground font-medium">
              {nomesPorFicha.get(linha.fichaTecnicaId) ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(linha.quantidadeVendida)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarMoeda(linha.faturamento)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatarMoeda(linha.margem)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DashboardProdutosRentaveis({
  porProduto,
  nomesPorFicha,
}: DashboardProdutosRentaveisProps) {
  const maisRentaveis = porProduto.slice(0, 5);
  const menosRentaveis = [...porProduto].reverse().slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <Text weight="semibold">Produtos mais rentáveis</Text>
        <TabelaProdutos linhas={maisRentaveis} nomesPorFicha={nomesPorFicha} />
      </div>
      <div className="flex flex-col gap-3">
        <Text weight="semibold">Produtos menos rentáveis</Text>
        <TabelaProdutos linhas={menosRentaveis} nomesPorFicha={nomesPorFicha} />
      </div>
    </div>
  );
}
