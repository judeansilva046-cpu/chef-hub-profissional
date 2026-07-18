import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { DreDemonstrativo } from "@/features/dre/components/dre-demonstrativo";
import { buscarDRE } from "@/features/dre/queries";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { FluxoCaixaFiltros } from "@/features/fluxo-caixa/components/fluxo-caixa-filtros";
import { ExportarRelatorioButtons } from "@/features/relatorios/components/exportar-relatorio-buttons";

export const metadata: Metadata = {
  title: "DRE — Chef Hub Profissional",
};

interface DrePageProps {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}

function mesAtualIntervalo(): { inicio: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default async function DrePage({ searchParams }: DrePageProps) {
  const params = await searchParams;
  const padrao = mesAtualIntervalo();
  const dataInicio = params.dataInicio ?? padrao.inicio;
  const dataFim = params.dataFim ?? padrao.fim;

  const dre = await buscarDRE({ dataInicio, dataFim });

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>DRE — Demonstrativo de Resultado</Heading>
            <Text tone="muted">
              Receita bruta, CMV, lucro bruto, despesas operacionais (regime de caixa) e lucro líquido do período.
            </Text>
          </div>
          <ExportarRelatorioButtons tipo="dre" searchParams={{ dataInicio, dataFim }} />
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <FluxoCaixaFiltros />

        <DreDemonstrativo dre={dre} />
      </Container>
    </Section>
  );
}
