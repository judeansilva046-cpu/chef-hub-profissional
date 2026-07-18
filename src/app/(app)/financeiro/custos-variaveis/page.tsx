import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CustosVariaveisManager } from "@/features/financeiro/components/custos-variaveis-manager";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { listarCustosVariaveis } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Custos variáveis — Chef Hub Profissional",
};

export default async function CustosVariaveisPage() {
  const custosVariaveis = await listarCustosVariaveis();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Custos variáveis</Heading>
          <Text tone="muted">
            Custos que só existem quando há uma venda — taxa de cartão,
            comissões, embalagem.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <CustosVariaveisManager custosVariaveis={custosVariaveis} />
      </Container>
    </Section>
  );
}
