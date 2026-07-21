import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ActivityFeed } from "@/features/observabilidade/components/activity-feed";
import { AlertsPanel } from "@/features/observabilidade/components/alerts-panel";
import { AuditTable } from "@/features/observabilidade/components/audit-table";
import { AuditTimeline } from "@/features/observabilidade/components/audit-timeline";
import { ErrorPanel } from "@/features/observabilidade/components/error-panel";
import { MetricsDashboard } from "@/features/observabilidade/components/metrics-dashboard";
import { PerformanceCard } from "@/features/observabilidade/components/performance-card";
import { SystemHealth } from "@/features/observabilidade/components/system-health";
import { SystemStatus } from "@/features/observabilidade/components/system-status";
import { podeVerObservabilidade } from "@/features/observabilidade/permissions";
import { carregarPainelObservabilidade } from "@/features/observabilidade/queries";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { caminhoCasaDoPapel } from "@/server/auth/permissoes-rota";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export const metadata: Metadata = {
  title: "Monitoramento — Chef Hub Profissional",
};

export default async function AdminObservabilidadePage() {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (!podeVerObservabilidade(papel)) {
    redirect(papel ? caminhoCasaDoPapel(papel) : "/dashboard");
  }

  const data = await carregarPainelObservabilidade();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-8">
        <div>
          <Heading level={2}>Monitoramento</Heading>
          <Text tone="muted">
            Auditoria, logs, alertas, métricas e saúde do sistema da empresa
            ativa. Isolado por RLS e papel (owner/gerente).
          </Text>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <Heading level={4}>Status</Heading>
            <SystemStatus report={data.health} />
          </section>
          <section className="flex flex-col gap-3">
            <Heading level={4}>Health check</Heading>
            <SystemHealth report={data.health} />
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <Heading level={4}>Métricas</Heading>
          <MetricsDashboard metrics={data.metrics} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <Heading level={4}>Alertas</Heading>
            <AlertsPanel alerts={data.alertas} />
          </section>
          <section className="flex flex-col gap-3">
            <Heading level={4}>Erros</Heading>
            <ErrorPanel logs={data.logs} />
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <Heading level={4}>Atividade</Heading>
            <ActivityFeed items={data.activity} />
          </section>
          <section className="flex flex-col gap-3">
            <Heading level={4}>Performance (≥300ms)</Heading>
            <PerformanceCard samples={data.performance} />
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <Heading level={4}>Timeline (auditoria)</Heading>
          <AuditTimeline items={data.activity} />
        </section>

        <section className="flex flex-col gap-3">
          <Heading level={4}>Tabela de auditoria</Heading>
          <AuditTable rows={data.auditoria} />
        </section>
      </Container>
    </Section>
  );
}
