import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { FunilBoard } from "@/features/funil/components/funil-board";
import { NovaEtapaDialog } from "@/features/funil/components/nova-etapa-dialog";
import { NovoLeadDialog } from "@/features/funil/components/novo-lead-dialog";
import { listarEtapasFunil, listarLeadsAbertos } from "@/features/funil/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "Funil comercial — CRM — Chef Hub Profissional",
};

export default async function FunilPage() {
  const empresa = await getEmpresaAtual();
  const [etapas, leads] = await Promise.all([listarEtapasFunil(), listarLeadsAbertos()]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Funil comercial</Heading>
          <div className="flex gap-2">
            <NovaEtapaDialog />
            <NovoLeadDialog etapas={etapas} />
          </div>
        </div>

        {empresa && <FunilBoard etapas={etapas} leads={leads} empresaId={empresa.id} />}
      </Container>
    </Section>
  );
}
