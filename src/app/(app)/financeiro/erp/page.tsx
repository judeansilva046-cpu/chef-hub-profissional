import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ErpDashboard } from "@/features/financeiro/components/erp-dashboard";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { carregarDashboardErp } from "@/features/financeiro/erp/queries";
import { sincronizarAlertasFinanceiros } from "@/features/financeiro/erp/actions";

export const metadata: Metadata = {
  title: "ERP Financeiro — Chef Hub Profissional",
};

interface PageProps {
  searchParams: Promise<{ dataInicio?: string; dataFim?: string }>;
}

export default async function FinanceiroErpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await carregarDashboardErp({
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  });

  try {
    await sincronizarAlertasFinanceiros();
  } catch {
    /* best-effort */
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />
        <div>
          <Heading level={2}>ERP Financeiro</Heading>
          <Text tone="muted">
            DRE, fluxo de caixa, contas a pagar/receber, CMV, margem, EBITDA e
            alertas — isolado por empresa (RBAC + RLS).
          </Text>
        </div>
        <ErpDashboard data={data} />
      </Container>
    </Section>
  );
}
