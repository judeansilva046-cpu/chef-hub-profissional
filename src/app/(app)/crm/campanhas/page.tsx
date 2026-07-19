import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { NovaCampanhaDialog } from "@/features/comunicacao/components/campanha-dialog";
import { CampanhasTable } from "@/features/comunicacao/components/campanhas-table";
import { listarCampanhas, listarTemplates } from "@/features/comunicacao/queries";
import { listarCupons } from "@/features/cupons/queries";

export const metadata: Metadata = {
  title: "Campanhas — CRM — Chef Hub Profissional",
};

export default async function CampanhasPage() {
  const [campanhas, templates, cupons] = await Promise.all([
    listarCampanhas(),
    listarTemplates(),
    listarCupons(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Campanhas automáticas</Heading>
          <NovaCampanhaDialog
            templates={templates.filter((t) => t.ativo).map((t) => ({ id: t.id, nome: t.nome }))}
            cupons={cupons.filter((c) => c.ativo).map((c) => ({ id: c.id, codigo: c.codigo }))}
          />
        </div>

        <CampanhasTable campanhas={campanhas} />
      </Container>
    </Section>
  );
}
