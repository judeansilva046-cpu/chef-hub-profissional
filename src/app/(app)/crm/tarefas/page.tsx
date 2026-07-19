import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Section } from "@/components/ui/section";
import { CRM_SUB_NAV_LINKS } from "@/features/crm/components/crm-sub-nav-links";
import { NovaTarefaDialog } from "@/features/tarefas/components/nova-tarefa-dialog";
import { TarefasTable } from "@/features/tarefas/components/tarefas-table";
import { listarTarefas } from "@/features/tarefas/queries";

export const metadata: Metadata = {
  title: "Tarefas — CRM — Chef Hub Profissional",
};

interface TarefasPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TarefasPage({ searchParams }: TarefasPageProps) {
  const params = await searchParams;
  const tarefas = await listarTarefas({ status: params.status });

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>CRM</Heading>
          <ModuleSubNav links={CRM_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level={3}>Tarefas e follow-up</Heading>
          <NovaTarefaDialog />
        </div>

        <TarefasTable tarefas={tarefas} />
      </Container>
    </Section>
  );
}
