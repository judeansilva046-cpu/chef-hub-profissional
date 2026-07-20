import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { FuncionariosManager } from "@/features/financeiro/components/funcionarios-manager";
import { listarFuncionarios } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Custos de funcionários — Chef Hub Profissional",
};

export default async function FuncionariosPage() {
  const funcionarios = await listarFuncionarios();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Calculadora de custos de funcionários</Heading>
          <Text tone="muted">
            Estimativa de custo total por funcionário (salário, encargos e
            benefícios) e da folha mensal — não é uma folha de pagamento com
            apuração fiscal.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <FuncionariosManager funcionarios={funcionarios} />
      </Container>
    </Section>
  );
}
