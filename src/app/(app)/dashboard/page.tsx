import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { analisarVendas, somarMetasNoPeriodo } from "@/features/dashboard/calculations";
import { DashboardComparativoCanal } from "@/features/dashboard/components/dashboard-comparativo-canal";
import { DashboardMetaRealizado } from "@/features/dashboard/components/dashboard-meta-realizado";
import { DashboardProdutosRentaveis } from "@/features/dashboard/components/dashboard-produtos-rentaveis";
import { DashboardResumoCards } from "@/features/dashboard/components/dashboard-resumo-cards";
import {
  analisarFichasEmAlerta,
  calcularMargemNecessariaPercentual,
  calcularPontoEquilibrioReceita,
} from "@/features/financeiro/calculations";
import { PainelAlertas } from "@/features/financeiro/components/painel-alertas";
import {
  calcularCustosFixosTotais,
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
  listarFichasTecnicasParaFinanceiro,
  listarMetasVendas,
} from "@/features/financeiro/queries";
import { listarPedidosCompra } from "@/features/compras/queries";
import { buscarResumoEstoque } from "@/features/estoque/queries";
import { getSemanaRange, hojeIso } from "@/features/producao/date-range";
import { listarProducoesPlanejadas } from "@/features/producao/queries";
import { VendasFiltros } from "@/features/vendas/components/vendas-filtros";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

export const metadata: Metadata = {
  title: "Dashboard Executivo — Chef Hub Profissional",
};

interface DashboardPageProps {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    canalVendaId?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const dataInicio = params.dataInicio || primeiroDiaDoMesAtual();
  const dataFim = params.dataFim || ultimoDiaDoMesAtual();
  const semanaAtual = getSemanaRange(hojeIso());

  const [
    vendas,
    fichas,
    canais,
    custosVariaveis,
    custosFixosTotais,
    metas,
    resumoEstoque,
    pedidosRascunho,
    pedidosEnviado,
    pedidosParcial,
    producoesSemana,
  ] = await Promise.all([
    buscarVendasPorPeriodo({ dataInicio, dataFim, canalVendaId: params.canalVendaId }),
    listarFichasTecnicasParaFinanceiro(),
    listarCanaisVenda(),
    calcularCustosVariaveisAgregados(),
    calcularCustosFixosTotais(),
    listarMetasVendas(),
    buscarResumoEstoque(),
    listarPedidosCompra({ status: "rascunho" }),
    listarPedidosCompra({ status: "enviado" }),
    listarPedidosCompra({ status: "parcialmente_recebido" }),
    listarProducoesPlanejadas({
      dataInicio: semanaAtual.inicio,
      dataFim: semanaAtual.fim,
    }),
  ]);

  const canaisPorId = new Map(canais.map((canal) => [canal.id, canal]));
  const nomesPorFicha = new Map(fichas.map((ficha) => [ficha.id, ficha.nome]));
  const nomesPorCanal = new Map(canais.map((canal) => [canal.id, canal.nome]));

  const { resumo, porProduto, porCanal } = analisarVendas(vendas, custosVariaveis, canaisPorId);
  const faturamentoProjetado = somarMetasNoPeriodo(metas, dataInicio, dataFim);

  const margemNecessariaPercentual = calcularMargemNecessariaPercentual(
    custosFixosTotais,
    faturamentoProjetado,
  );
  const { fichasNoVermelho, fichasAbaixoDoNecessario } = analisarFichasEmAlerta(
    fichas,
    custosVariaveis,
    margemNecessariaPercentual,
  );
  const pontoEquilibrioReceita = calcularPontoEquilibrioReceita(
    custosFixosTotais,
    resumo.margemPercentual,
  );
  const lucroEstimado = resumo.margemRealizada - custosFixosTotais;

  const pedidosCompraPendentes =
    pedidosRascunho.totalCount + pedidosEnviado.totalCount + pedidosParcial.totalCount;
  const producoesNaoConcluidasNaSemana = producoesSemana.filter(
    (producao) => producao.status === "planejada" || producao.status === "em_producao",
  ).length;

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Dashboard Executivo</Heading>
          <Text tone="muted">
            Visão consolidada da empresa ativa no período selecionado — para
            comparar outra empresa, troque no seletor do topo. Dados reais,
            calculados a partir das vendas registradas.
          </Text>
        </div>

        <VendasFiltros canais={canais} />

        <DashboardResumoCards
          faturamentoRealizado={resumo.faturamentoRealizado}
          faturamentoProjetado={faturamentoProjetado}
          cmvPercentual={resumo.cmvPercentual}
          margemPercentual={resumo.margemPercentual}
          lucroEstimado={lucroEstimado}
          pontoEquilibrioReceita={pontoEquilibrioReceita}
        />

        <DashboardMetaRealizado
          faturamentoRealizado={resumo.faturamentoRealizado}
          faturamentoProjetado={faturamentoProjetado}
        />

        <PainelAlertas
          fichasNoVermelho={fichasNoVermelho}
          fichasAbaixoDoNecessario={fichasAbaixoDoNecessario}
          ingredientesAbaixoDoMinimo={resumoEstoque.ingredientesAbaixoDoMinimo}
          lotesVencendoEm7Dias={resumoEstoque.lotesVencendoEm7Dias}
          pedidosCompraPendentes={pedidosCompraPendentes}
          producoesNaoConcluidasNaSemana={producoesNaoConcluidasNaSemana}
        />

        <div>
          <Heading level={3} className="mb-3">
            Produtos mais e menos rentáveis
          </Heading>
          <DashboardProdutosRentaveis porProduto={porProduto} nomesPorFicha={nomesPorFicha} />
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Comparativo por canal de venda
          </Heading>
          <DashboardComparativoCanal porCanal={porCanal} nomesPorCanal={nomesPorCanal} />
        </div>
      </Container>
    </Section>
  );
}
