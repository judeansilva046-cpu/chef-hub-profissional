import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { CampanhaForm, CampanhasLista } from "@/features/crm/components/campanha-form";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { listarCampanhas } from "@/features/crm/queries";

export const metadata: Metadata = {
  title: "Campanhas — Chef Hub Profissional",
};

export default async function CampanhasPage() {
  const campanhas = await listarCampanhas();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Campanhas e automações</Heading>
          <Text tone="muted">
            WhatsApp, e-mail, SMS e push — envio via Central de Integrações (stubs até Sprint 18).
          </Text>
        </div>
        <ModuleSubNav links={CRM_SUB_NAV_LINKS} />
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <CampanhaForm />
          <CampanhasLista campanhas={campanhas} />
        </div>
      </Container>
    </Section>
  );
}
