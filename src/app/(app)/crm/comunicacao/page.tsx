import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { NovoTemplateDialog } from "@/features/comunicacao/components/template-dialog";
import { TemplatesTable } from "@/features/comunicacao/components/templates-table";
import { ReclamacoesTable } from "@/features/comunicacao/components/reclamacoes-table";
import { listarReclamacoes, listarTemplates } from "@/features/comunicacao/queries";

export const metadata: Metadata = {
  title: "Comunicação — CRM — Chef Hub Profissional",
};

export default async function ComunicacaoPage() {
  const [templates, reclamacoes] = await Promise.all([listarTemplates(), listarReclamacoes()]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Templates de mensagem</Heading>
          <NovoTemplateDialog />
        </div>
        <TemplatesTable templates={templates} />

        <div>
          <Heading level={3} className="mb-3">
            Reclamações
          </Heading>
          <ReclamacoesTable reclamacoes={reclamacoes} />
        </div>
      </Container>
    </Section>
  );
}
