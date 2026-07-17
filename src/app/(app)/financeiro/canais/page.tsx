import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CanaisVendaManager } from "@/features/financeiro/components/canais-venda-manager";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { listarCanaisVenda } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Canais de venda — Chef Hub Profissional",
};

export default async function CanaisVendaPage() {
  const canais = await listarCanaisVenda();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Canais de venda</Heading>
          <Text tone="muted">
            Comissão e taxa fixa de iFood, 99Food, Keeta, Delivery Próprio e
            canais personalizados — usadas na Precificação para comparar
            preço e margem por canal.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <CanaisVendaManager canais={canais} />
      </Container>
    </Section>
  );
}
