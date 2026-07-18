import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CentrosCustoManager } from "@/features/financeiro/components/centros-custo-manager";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { listarCentrosCusto } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Centros de custo — Chef Hub Profissional",
};

export default async function CentrosCustoPage() {
  const centros = await listarCentrosCusto();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Centros de custo</Heading>
          <Text tone="muted">Agrupa despesas por setor (cozinha, salão, delivery, administrativo) para relatórios.</Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <CentrosCustoManager centros={centros} />
      </Container>
    </Section>
  );
}
