import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { SimuladorPromocoesForm } from "@/features/financeiro/components/simulador-promocoes-form";
import {
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
  listarFichasTecnicasParaFinanceiro,
} from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Simulador de promoções — Chef Hub Profissional",
};

export default async function SimuladorPromocoesPage() {
  const [fichas, custosVariaveis, canais] = await Promise.all([
    listarFichasTecnicasParaFinanceiro(),
    calcularCustosVariaveisAgregados(),
    listarCanaisVenda(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Simulador de promoções</Heading>
          <Text tone="muted">
            Veja o impacto de um desconto na margem antes de aplicá-lo — sem
            afetar o preço praticado da ficha técnica.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <SimuladorPromocoesForm
          fichas={fichas}
          custosVariaveis={custosVariaveis}
          canais={canais}
        />
      </Container>
    </Section>
  );
}
