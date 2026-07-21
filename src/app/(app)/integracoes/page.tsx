import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { IntegrationHub } from "@/features/integracoes/components/integration-hub";
import {
  listarCentralIntegracoes,
  listarLogsIntegracao,
  listarSyncsIntegracao,
  obterStatusIntegracoes,
} from "@/features/integracoes/queries";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { caminhoCasaDoPapel } from "@/server/auth/permissoes-rota";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export const metadata: Metadata = {
  title: "Central de Integrações — Chef Hub Profissional",
};

export default async function IntegracoesPage() {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (papel !== "owner") {
    redirect(papel ? caminhoCasaDoPapel(papel) : "/dashboard");
  }

  const [items, logs, syncs, status] = await Promise.all([
    listarCentralIntegracoes(),
    listarLogsIntegracao({ limit: 30 }),
    listarSyncsIntegracao({ limit: 20 }),
    obterStatusIntegracoes(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Central de Integrações</Heading>
          <Text tone="muted">
            Conectores desacoplados para delivery, WhatsApp, PIX, impressoras e
            cardápio digital. Credenciais criptografadas (AES-256-GCM). Nenhuma
            chamada real a provedores — infraestrutura pronta para homologação
            futura.
          </Text>
        </div>

        <IntegrationHub
          items={items}
          logs={logs}
          syncs={syncs}
          status={status}
        />
      </Container>
    </Section>
  );
}
