import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { resumirContasPagar } from "@/features/contas-pagar/queries";
import { resumirContasReceber } from "@/features/contas-receber/queries";
import { buscarDRE } from "@/features/dre/queries";
import { DashboardFinanceiroIndicadores } from "@/features/financeiro/components/dashboard-financeiro-indicadores";
import { DashboardFinanceiroResumoCards } from "@/features/financeiro/components/dashboard-financeiro-resumo-cards";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { FluxoCaixaFiltros } from "@/features/fluxo-caixa/components/fluxo-caixa-filtros";
import { FluxoCaixaTable } from "@/features/fluxo-caixa/components/fluxo-caixa-table";
import { buscarFluxoCaixaPorMes } from "@/features/fluxo-caixa/queries";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";

export const metadata: Metadata = {
  title: "Dashboard Financeiro — Chef Hub Profissional",
};

interface DashboardFinanceiroPageProps {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}

function mesAtualIntervalo(): { inicio: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

function fluxoCaixaIntervalo(): { inicio: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default async function DashboardFinanceiroPage({ searchParams }: DashboardFinanceiroPageProps) {
  const params = await searchParams;
  const padrao = mesAtualIntervalo();
  const dataInicio = params.dataInicio ?? padrao.inicio;
  const dataFim = params.dataFim ?? padrao.fim;
  const fluxoCaixaPeriodo = fluxoCaixaIntervalo();

  const [dre, contasPagar, contasReceber, vendasDoPeriodo, fluxoCaixa] = await Promise.all([
    buscarDRE({ dataInicio, dataFim }),
    resumirContasPagar(),
    resumirContasReceber(),
    buscarVendasPorPeriodo({ dataInicio, dataFim }),
    buscarFluxoCaixaPorMes({ dataInicio: fluxoCaixaPeriodo.inicio, dataFim: fluxoCaixaPeriodo.fim }),
  ]);

  const ticketMedio = vendasDoPeriodo.length > 0 ? dre.receitaBruta / vendasDoPeriodo.length : null;

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Dashboard Financeiro</Heading>
          <Text tone="muted">
            Visão consolidada do financeiro no período selecionado: receita, despesas, lucro, CMV, margem e ticket
            médio calculados a partir das vendas e contas reais.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <FluxoCaixaFiltros />

        <DashboardFinanceiroResumoCards
          receitaBruta={dre.receitaBruta}
          despesasOperacionais={dre.despesasOperacionais}
          lucroLiquido={dre.lucroLiquido}
          margemLiquidaPercentual={dre.margemLiquidaPercentual}
          cmvPercentual={dre.receitaBruta > 0 ? (dre.cmv / dre.receitaBruta) * 100 : null}
          ticketMedio={ticketMedio}
        />

        <DashboardFinanceiroIndicadores contasPagar={contasPagar} contasReceber={contasReceber} />

        <div className="min-w-0">
          <Heading level={3} className="mb-3">
            Fluxo de caixa (últimos meses)
          </Heading>
          <FluxoCaixaTable linhas={fluxoCaixa} />
        </div>
      </Container>
    </Section>
  );
}
