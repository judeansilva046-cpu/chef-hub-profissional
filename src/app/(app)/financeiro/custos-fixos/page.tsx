import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CustosFixosManager } from "@/features/financeiro/components/custos-fixos-manager";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { listarCustosFixos } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Custos fixos — Chef Hub Profissional",
};

export default async function CustosFixosPage() {
  const custosFixos = await listarCustosFixos();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Custos fixos</Heading>
          <Text tone="muted">
            Despesas mensais recorrentes — a base do Ponto de Equilíbrio e do
            Painel Nunca no Vermelho.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <CustosFixosManager custosFixos={custosFixos} />
      </Container>
    </Section>
  );
}
