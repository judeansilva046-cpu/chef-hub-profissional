import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { MembrosTable } from "@/features/permissoes/components/membros-table";
import { buscarContextoPermissoes } from "@/features/permissoes/queries";

export const metadata: Metadata = {
  title: "Permissões — Chef Hub Profissional",
};

export default async function PermissoesPage() {
  const contexto = await buscarContextoPermissoes();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Permissões</Heading>
          <Text tone="muted">Quem tem acesso ao financeiro desta empresa e com qual nível de permissão.</Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        {contexto ? (
          <MembrosTable membros={contexto.membros} souDono={contexto.souDono} />
        ) : (
          <EmptyState title="Nenhuma empresa ativa" description="Selecione uma empresa para gerenciar permissões." />
        )}
      </Container>
    </Section>
  );
}
