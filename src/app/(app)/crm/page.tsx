import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { CrmDashboard } from "@/features/crm/components/crm-dashboard";
import { carregarDashboardCrm } from "@/features/crm/queries";

export const metadata: Metadata = {
  title: "CRM — Chef Hub Profissional",
};

export default async function CrmPage() {
  const data = await carregarDashboardCrm();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={CRM_SUB_NAV_LINKS} />
        <CrmDashboard data={data} />
      </Container>
    </Section>
  );
}
