import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { DashboardInteligente } from "@/features/estoque/inteligente/components/dashboard-inteligente";
import { carregarDashboardEstoqueInteligente } from "@/features/estoque/inteligente/queries";

export const metadata: Metadata = {
  title: "Estoque inteligente — Chef Hub Profissional",
};

export default async function EstoqueInteligentePage() {
  const data = await carregarDashboardEstoqueInteligente();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />
        <DashboardInteligente data={data} />
      </Container>
    </Section>
  );
}
