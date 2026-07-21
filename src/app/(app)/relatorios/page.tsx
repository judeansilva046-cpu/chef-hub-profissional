import type { Metadata } from "next";
import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { analisarVendas } from "@/features/dashboard/calculations";
import { SaldoEstoqueTable } from "@/features/estoque/components/saldo-estoque-table";
import { listarSaldosEstoque } from "@/features/estoque/queries";
import {
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
  listarFichasTecnicasParaFinanceiro,
} from "@/features/financeiro/queries";
import { listarProducoesPlanejadas } from "@/features/producao/queries";
import { RelatorioTipoSelect } from "@/features/relatorios/components/relatorio-tipo-select";
import { relatorioCompras, relatorioVendas } from "@/features/relatorios/queries";
import { RELATORIO_TIPOS, type RelatorioTipo } from "@/features/relatorios/tipos";
import { VendasFiltros } from "@/features/vendas/components/vendas-filtros";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { formatarData, formatarDecimal, formatarMoeda } from "@/lib/format";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

export const metadata: Metadata = {
  title: "Relatórios Gerenciais — Chef Hub Profissional",
};

interface RelatoriosPageProps {
  searchParams: Promise<{
    tipo?: string;
    dataInicio?: string;
    dataFim?: string;
    canalVendaId?: string;
  }>;
}

const STATUS_PEDIDO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  parcialmente_recebido: "Parcialmente recebido",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const params = await searchParams;
  const tipo = (RELATORIO_TIPOS.some((item) => item.value === params.tipo)
    ? params.tipo
    : "vendas") as RelatorioTipo;
  const dataInicio = params.dataInicio || primeiroDiaDoMesAtual();
  const dataFim = params.dataFim || ultimoDiaDoMesAtual();
  const canalVendaId = params.canalVendaId;

  const canais = await listarCanaisVenda();

  const exportQuery = new URLSearchParams({ dataInicio, dataFim });
  if (canalVendaId) exportQuery.set("canalVendaId", canalVendaId);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Relatórios Gerenciais</Heading>
            <Text tone="muted">
              Vendas, CMV, margem, estoque, compras, produção, por produto e
              por canal — com exportação em CSV e PDF.
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/relatorios/${tipo}?${exportQuery.toString()}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </a>
            <a
              href={`/api/relatorios/${tipo}?${exportQuery.toString()}&formato=pdf`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <RelatorioTipoSelect />
          <VendasFiltros canais={canais} />
        </div>

        {tipo === "vendas" && (
          <RelatorioVendas dataInicio={dataInicio} dataFim={dataFim} canalVendaId={canalVendaId} />
        )}
        {(tipo === "cmv" || tipo === "margem" || tipo === "produto") && (
          <RelatorioPorProduto
            dataInicio={dataInicio}
            dataFim={dataFim}
            canalVendaId={canalVendaId}
            foco={tipo}
          />
        )}
        {tipo === "canal" && (
          <RelatorioPorCanal dataInicio={dataInicio} dataFim={dataFim} canalVendaId={canalVendaId} />
        )}
        {tipo === "estoque" && <RelatorioEstoque />}
        {tipo === "compras" && (
          <RelatorioCompras dataInicio={dataInicio} dataFim={dataFim} />
        )}
        {tipo === "producao" && (
          <RelatorioProducao dataInicio={dataInicio} dataFim={dataFim} />
        )}
      </Container>
    </Section>
  );
}

async function RelatorioVendas({
  dataInicio,
  dataFim,
  canalVendaId,
}: {
  dataInicio: string;
  dataFim: string;
  canalVendaId?: string;
}) {
  const linhas = await relatorioVendas({ dataInicio, dataFim, canalVendaId });

  if (linhas.length === 0) {
    return <EmptyState title="Nenhuma venda no período" description="Ajuste os filtros ou registre vendas." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Ficha técnica</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Preço unitário</TableHead>
          <TableHead className="text-right">Valor total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => (
          <TableRow key={linha.id}>
            <TableCell className="text-muted-foreground">{formatarData(linha.dataVenda)}</TableCell>
            <TableCell className="text-foreground font-medium">{linha.fichaTecnicaNome}</TableCell>
            <TableCell className="text-muted-foreground">{linha.canalNome ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{linha.clienteNome ?? "—"}</TableCell>
            <TableCell>{formatarDecimal(linha.quantidade)}</TableCell>
            <TableCell>{formatarMoeda(linha.precoUnitario)}</TableCell>
            <TableCell className="text-right font-medium">{formatarMoeda(linha.valorTotal)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function RelatorioPorProduto({
  dataInicio,
  dataFim,
  canalVendaId,
  foco,
}: {
  dataInicio: string;
  dataFim: string;
  canalVendaId?: string;
  foco: "cmv" | "margem" | "produto";
}) {
  const [vendas, fichas, canais, custosVariaveis] = await Promise.all([
    buscarVendasPorPeriodo({ dataInicio, dataFim, canalVendaId }),
    listarFichasTecnicasParaFinanceiro(),
    listarCanaisVenda(),
    calcularCustosVariaveisAgregados(),
  ]);
  const nomesPorFicha = new Map(fichas.map((ficha) => [ficha.id, ficha.nome]));
  const canaisPorId = new Map(canais.map((canal) => [canal.id, canal]));
  const { porProduto } = analisarVendas(vendas, custosVariaveis, canaisPorId);

  if (porProduto.length === 0) {
    return <EmptyState title="Nenhuma venda no período" description="Ajuste os filtros ou registre vendas." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Quantidade vendida</TableHead>
          <TableHead>Faturamento</TableHead>
          {foco !== "produto" && <TableHead>{foco === "cmv" ? "CMV" : "Margem"}</TableHead>}
          {foco === "produto" && (
            <>
              <TableHead>CMV</TableHead>
              <TableHead>Margem</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {porProduto.map((linha) => (
          <TableRow key={linha.fichaTecnicaId}>
            <TableCell className="text-foreground font-medium">
              {nomesPorFicha.get(linha.fichaTecnicaId) ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(linha.quantidadeVendida)}
            </TableCell>
            <TableCell className="text-muted-foreground">{formatarMoeda(linha.faturamento)}</TableCell>
            {foco === "cmv" && <TableCell>{formatarMoeda(linha.custoTotal)}</TableCell>}
            {foco === "margem" && <TableCell>{formatarMoeda(linha.margem)}</TableCell>}
            {foco === "produto" && (
              <>
                <TableCell>{formatarMoeda(linha.custoTotal)}</TableCell>
                <TableCell>{formatarMoeda(linha.margem)}</TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function RelatorioPorCanal({
  dataInicio,
  dataFim,
  canalVendaId,
}: {
  dataInicio: string;
  dataFim: string;
  canalVendaId?: string;
}) {
  const [vendas, canais, custosVariaveis] = await Promise.all([
    buscarVendasPorPeriodo({ dataInicio, dataFim, canalVendaId }),
    listarCanaisVenda(),
    calcularCustosVariaveisAgregados(),
  ]);
  const nomesPorCanal = new Map(canais.map((canal) => [canal.id, canal.nome]));
  const canaisPorId = new Map(canais.map((canal) => [canal.id, canal]));
  const { porCanal } = analisarVendas(vendas, custosVariaveis, canaisPorId);

  if (porCanal.length === 0) {
    return <EmptyState title="Nenhuma venda no período" description="Ajuste os filtros ou registre vendas." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Canal</TableHead>
          <TableHead>Quantidade vendida</TableHead>
          <TableHead>Faturamento</TableHead>
          <TableHead>CMV</TableHead>
          <TableHead className="text-right">Margem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {porCanal.map((linha) => (
          <TableRow key={linha.canalVendaId ?? "sem-canal"}>
            <TableCell className="text-foreground font-medium">
              {linha.canalVendaId ? (nomesPorCanal.get(linha.canalVendaId) ?? "—") : "Sem canal"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatarDecimal(linha.quantidadeVendida)}
            </TableCell>
            <TableCell className="text-muted-foreground">{formatarMoeda(linha.faturamento)}</TableCell>
            <TableCell className="text-muted-foreground">{formatarMoeda(linha.custoTotal)}</TableCell>
            <TableCell className="text-right font-medium">{formatarMoeda(linha.margem)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function RelatorioEstoque() {
  const saldos = await listarSaldosEstoque();
  return <SaldoEstoqueTable saldos={saldos} />;
}

async function RelatorioCompras({ dataInicio, dataFim }: { dataInicio: string; dataFim: string }) {
  const linhas = await relatorioCompras({ dataInicio, dataFim });

  if (linhas.length === 0) {
    return <EmptyState title="Nenhum pedido de compra no período" description="Ajuste os filtros." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data do pedido</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {linhas.map((linha) => (
          <TableRow key={linha.id}>
            <TableCell className="text-muted-foreground">{formatarData(linha.dataPedido)}</TableCell>
            <TableCell className="text-foreground font-medium">{linha.fornecedorNome}</TableCell>
            <TableCell className="text-muted-foreground">
              {STATUS_PEDIDO_LABEL[linha.status] ?? linha.status}
            </TableCell>
            <TableCell className="text-right font-medium">{formatarMoeda(linha.valorTotal)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

async function RelatorioProducao({ dataInicio, dataFim }: { dataInicio: string; dataFim: string }) {
  const producoes = await listarProducoesPlanejadas({ dataInicio, dataFim });

  if (producoes.length === 0) {
    return <EmptyState title="Nenhuma produção no período" description="Ajuste os filtros." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Ficha técnica</TableHead>
          <TableHead>Quantidade planejada</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {producoes.map((producao) => (
          <TableRow key={producao.id}>
            <TableCell className="text-muted-foreground">
              {formatarData(producao.data_producao)}
            </TableCell>
            <TableCell className="text-foreground font-medium">
              {producao.fichas_tecnicas.nome}
            </TableCell>
            <TableCell>{formatarDecimal(producao.quantidade_planejada)}</TableCell>
            <TableCell className="text-muted-foreground">{producao.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
