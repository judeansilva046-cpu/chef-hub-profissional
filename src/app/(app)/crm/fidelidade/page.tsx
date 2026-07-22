import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { FidelidadeForm } from "@/features/crm/components/fidelidade-form";
import { obterProgramaFidelidade } from "@/features/crm/queries";

export const metadata: Metadata = {
  title: "Fidelidade — Chef Hub Profissional",
};

export default async function FidelidadePage() {
  const programa = await obterProgramaFidelidade();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Programa de fidelidade</Heading>
          <Text tone="muted">
            Pontos, cashback, validade e regras configuráveis por empresa.
          </Text>
        </div>
        <ModuleSubNav links={CRM_SUB_NAV_LINKS} />
        <FidelidadeForm programa={programa} />
      </Container>
    </Section>
  );
}
