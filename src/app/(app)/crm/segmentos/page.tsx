import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { listarSegmentosComContagem } from "@/features/crm/queries";

export const metadata: Metadata = {
  title: "Segmentos — Chef Hub Profissional",
};

export default async function SegmentosPage() {
  const segmentos = await listarSegmentosComContagem();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Segmentação de clientes</Heading>
          <Text tone="muted">
            VIP, novos, inativos, alto/baixo ticket, frequentes e pouco frequentes.
          </Text>
        </div>
        <ModuleSubNav links={CRM_SUB_NAV_LINKS} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segmentos.map((s) => (
            <div key={s.id} className="border-border bg-card rounded-lg border p-4">
              <Text weight="semibold">{s.name}</Text>
              <Text size="sm" tone="muted">{s.description}</Text>
              <Text className="mt-2" weight="medium">
                {s.member_count} clientes
              </Text>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
