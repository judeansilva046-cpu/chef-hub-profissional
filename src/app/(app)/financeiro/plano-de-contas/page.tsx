import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { PlanoContasManager } from "@/features/financeiro/components/plano-contas-manager";
import { listarPlanoContas } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Plano de contas — Chef Hub Profissional",
};

export default async function PlanoContasPage() {
  const contas = await listarPlanoContas();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Plano de contas</Heading>
          <Text tone="muted">
            Categoriza contas a pagar, contas a receber e o DRE — a base contábil do módulo financeiro.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <PlanoContasManager contas={contas} />
      </Container>
    </Section>
  );
}
