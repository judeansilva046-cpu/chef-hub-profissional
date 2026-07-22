import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { IntegrationHub } from "@/features/integracoes/components/integration-hub";
import { carregarMetricasIntegracoes } from "@/features/integracoes/metrics";
import {
  listarCentralIntegracoes,
  listarLogsIntegracao,
  listarSyncsIntegracao,
  obterStatusIntegracoes,
} from "@/features/integracoes/queries";
import { getIntegracoesMode } from "@/integrations/mode";
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

  const [items, logs, syncs, status, metrics] = await Promise.all([
    listarCentralIntegracoes(),
    listarLogsIntegracao({ limit: 30 }),
    listarSyncsIntegracao({ limit: 20 }),
    obterStatusIntegracoes(),
    carregarMetricasIntegracoes(),
  ]);

  const mode = getIntegracoesMode();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Central de Integrações</Heading>
          <Text tone="muted">
            Homologação dos conectores (iFood, WhatsApp, PIX, impressoras e cardápio
            digital). Modo atual: <strong>{mode}</strong>. Credenciais AES-256-GCM;
            resiliência com retry, circuit breaker, DLQ e idempotência.
          </Text>
        </div>

        <IntegrationHub
          items={items}
          logs={logs}
          syncs={syncs}
          status={status}
          metrics={metrics}
        />
      </Container>
    </Section>
  );
}
