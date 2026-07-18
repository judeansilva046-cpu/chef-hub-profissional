import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ConciliacaoListas } from "@/features/conciliacao/components/conciliacao-listas";
import { listarContasPagarParaConciliar, listarParcelasParaConciliar } from "@/features/conciliacao/queries";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";

export const metadata: Metadata = {
  title: "Conciliação financeira — Chef Hub Profissional",
};

export default async function ConciliacaoPage() {
  const [contasPagar, parcelas] = await Promise.all([
    listarContasPagarParaConciliar(),
    listarParcelasParaConciliar(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Conciliação financeira</Heading>
          <Text tone="muted">
            Confirme que os pagamentos e recebimentos lançados no sistema batem com o extrato real (banco/maquininha).
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <ConciliacaoListas contasPagar={contasPagar} parcelas={parcelas} />
      </Container>
    </Section>
  );
}
