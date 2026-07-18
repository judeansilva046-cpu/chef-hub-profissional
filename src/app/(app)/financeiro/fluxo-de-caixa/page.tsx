import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { FluxoCaixaFiltros } from "@/features/fluxo-caixa/components/fluxo-caixa-filtros";
import { FluxoCaixaTable } from "@/features/fluxo-caixa/components/fluxo-caixa-table";
import { buscarFluxoCaixaPorMes } from "@/features/fluxo-caixa/queries";
import { ExportarRelatorioButtons } from "@/features/relatorios/components/exportar-relatorio-buttons";

export const metadata: Metadata = {
  title: "Fluxo de caixa — Chef Hub Profissional",
};

interface FluxoCaixaPageProps {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}

function dataPadrao(mesesAntes: number, mesesDepois: number): { inicio: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - mesesAntes, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + mesesDepois + 1, 0);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default async function FluxoCaixaPage({ searchParams }: FluxoCaixaPageProps) {
  const params = await searchParams;
  const padrao = dataPadrao(5, 2);
  const dataInicio = params.dataInicio ?? padrao.inicio;
  const dataFim = params.dataFim ?? padrao.fim;

  const linhas = await buscarFluxoCaixaPorMes({ dataInicio, dataFim });

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Fluxo de caixa</Heading>
            <Text tone="muted">
              Realizado (movimentações de caixa) e projetado (contas a pagar/receber pendentes), por mês.
            </Text>
          </div>
          <ExportarRelatorioButtons tipo="fluxo-caixa" searchParams={{ dataInicio, dataFim }} />
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <FluxoCaixaFiltros />

        <FluxoCaixaTable linhas={linhas} />
      </Container>
    </Section>
  );
}
