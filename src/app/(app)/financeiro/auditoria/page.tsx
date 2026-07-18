import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { AuditoriaFiltros } from "@/features/auditoria/components/auditoria-filtros";
import { AuditoriaTable } from "@/features/auditoria/components/auditoria-table";
import { listarAuditoriaFinanceira } from "@/features/auditoria/queries";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";

export const metadata: Metadata = {
  title: "Auditoria financeira — Chef Hub Profissional",
};

interface AuditoriaPageProps {
  searchParams: Promise<{ tabela?: string; page?: string }>;
}

export default async function AuditoriaPage({ searchParams }: AuditoriaPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarAuditoriaFinanceira({ tabela: params.tabela, page });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.tabela) query.set("tabela", params.tabela);
    query.set("page", String(novaPagina));
    return `/financeiro/auditoria?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Auditoria financeira</Heading>
          <Text tone="muted">Histórico completo de criações, alterações e exclusões no módulo financeiro.</Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <AuditoriaFiltros />

        <AuditoriaTable linhas={resultado.data} />

        <Pagination page={resultado.page} totalPages={resultado.totalPages} createHref={createHref} />
      </Container>
    </Section>
  );
}
