import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarDecimal, formatarMoeda } from "@/lib/format";

export interface LinhaPontoEquilibrioProduto {
  id: string;
  nome: string;
  unidadeSigla: string;
  margemUnitaria: number | null;
  unidadesNecessarias: number | null;
}

export interface PontoEquilibrioProdutoTableProps {
  linhas: LinhaPontoEquilibrioProduto[];
}

export function PontoEquilibrioProdutoTable({
  linhas,
}: PontoEquilibrioProdutoTableProps) {
  if (linhas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma ficha técnica ativa"
        description="Cadastre fichas técnicas com preço definido para ver o ponto de equilíbrio por produto."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ficha técnica</TableHead>
          <TableHead>Margem de contribuição unitária</TableHead>
          <TableHead>Unidades necessárias no mês</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => (
          <TableRow key={linha.id}>
            <TableCell className="text-foreground font-medium">
              {linha.nome}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {linha.margemUnitaria !== null
                ? formatarMoeda(linha.margemUnitaria)
                : "—"}
            </TableCell>
            <TableCell>
              {linha.unidadesNecessarias !== null ? (
                <>
                  {formatarDecimal(Math.ceil(linha.unidadesNecessarias))}{" "}
                  {linha.unidadeSigla}
                </>
              ) : (
                "—"
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
