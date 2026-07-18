import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { IntegracaoCard } from "@/features/integracoes/components/integracao-card";
import { listarIntegracoesPorProvedor } from "@/features/integracoes/queries";

export const metadata: Metadata = {
  title: "Integrações — Chef Hub Profissional",
};

export default async function IntegracoesPage() {
  const integracoes = await listarIntegracoesPorProvedor();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Integrações</Heading>
          <Text tone="muted">
            Estrutura pronta para iFood, 99Food, Keeta e Open Delivery —
            credenciais, status de conexão e logs de sincronização. Nenhuma
            chamada real é feita: cada provedor depende de credenciais de
            parceiro homologado que este projeto ainda não tem.
          </Text>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {integracoes.map((item) => (
            <IntegracaoCard
              key={item.provedor}
              provedor={item.provedor}
              provedorLabel={item.label}
              integracao={item.integracao}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
