import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { MetasVendasManager } from "@/features/financeiro/components/metas-vendas-manager";
import { listarMetasVendas } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Metas de vendas — Chef Hub Profissional",
};

export default async function MetasVendasPage() {
  const metas = await listarMetasVendas();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Metas de vendas</Heading>
          <Text tone="muted">
            Meta de faturamento por mês — usada para calcular a margem de
            contribuição necessária no Painel e na Precificação.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <MetasVendasManager metas={metas} />
      </Container>
    </Section>
  );
}
