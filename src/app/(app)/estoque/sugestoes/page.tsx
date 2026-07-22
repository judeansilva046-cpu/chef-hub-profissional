import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { SugestoesLista } from "@/features/estoque/inteligente/components/sugestoes-lista";
import { listarSugestoesCompra } from "@/features/estoque/inteligente/queries";

export const metadata: Metadata = {
  title: "Sugestões de compra — Chef Hub Profissional",
};

export default async function SugestoesCompraPage() {
  const sugestoes = await listarSugestoesCompra();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Sugestões de compra</Heading>
          <Text tone="muted">
            Lista gerada automaticamente a partir de estoque, consumo, sazonalidade e mínimo.
          </Text>
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />
        <SugestoesLista sugestoes={sugestoes} />
      </Container>
    </Section>
  );
}
