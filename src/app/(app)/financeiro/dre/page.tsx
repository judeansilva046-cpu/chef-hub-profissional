import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { carregarDashboardErp } from "@/features/financeiro/erp/queries";

export const metadata: Metadata = {
  title: "DRE — Chef Hub Profissional",
};

export default async function DrePage() {
  const data = await carregarDashboardErp();
  const { dre } = data;

  const rows: Array<[string, number]> = [
    ["Receita bruta", dre.receitaBruta],
    ["(-) Impostos", dre.impostos],
    ["Receita líquida", dre.receitaLiquida],
    ["(-) CMV", dre.cmv],
    ["Lucro bruto", dre.lucroBruto],
    ["(-) Despesas operacionais", dre.despesasOperacionais],
    ["(-) Folha", dre.folha],
    ["(-) Marketing", dre.marketing],
    ["(-) Aluguel", dre.aluguel],
    ["EBITDA", dre.ebitda],
    ["Lucro operacional", dre.lucroOperacional],
    ["Lucro líquido", dre.lucroLiquido],
  ];

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>DRE</Heading>
          <Text tone="muted">
            Demonstração de resultado do período{" "}
            {data.periodo.dataInicio} → {data.periodo.dataFim}.
          </Text>
        </div>
        <Text size="sm" tone="muted">
          Margem bruta {formatarPercentual(dre.margemBrutaPct)} · operacional{" "}
          {formatarPercentual(dre.margemOperacionalPct)} · líquida{" "}
          {formatarPercentual(dre.margemLiquidaPct)}
        </Text>
        <dl className="max-w-lg flex flex-col gap-1.5 text-sm">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="border-border flex justify-between gap-4 border-b py-2"
            >
              <dt>{label}</dt>
              <dd className="font-medium">{formatarMoeda(value)}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
