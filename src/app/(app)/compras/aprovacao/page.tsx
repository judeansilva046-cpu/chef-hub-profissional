import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { COMPRAS_SUB_NAV_LINKS } from "@/features/compras/components/compras-sub-nav-links";
import { NiveisAprovacaoTable } from "@/features/compras/components/niveis-aprovacao-table";
import {
  listarAprovadoresDisponiveis,
  listarNiveisAprovacao,
} from "@/features/compras/queries";
import { listarCentrosCusto } from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Fluxo de aprovação — Chef Hub Profissional",
};

export default async function AprovacaoPage() {
  const [niveis, centrosCusto, aprovadores] = await Promise.all([
    listarNiveisAprovacao(),
    listarCentrosCusto(),
    listarAprovadoresDisponiveis(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Fluxo de aprovação</Heading>
          <Text tone="muted">
            Configure faixas de valor com aprovadores específicos. Solicitações
            fora de qualquer faixa seguem o fallback: dono da empresa ou
            qualquer usuário com papel &quot;aprovador&quot;.
          </Text>
        </div>

        <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} />

        <NiveisAprovacaoTable
          niveis={niveis}
          centrosCusto={centrosCusto}
          aprovadores={aprovadores}
        />
      </Container>
    </Section>
  );
}
