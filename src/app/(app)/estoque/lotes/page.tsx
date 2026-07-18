import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { LotesTable } from "@/features/estoque/components/lotes-table";
import { listarLotesEstoque } from "@/features/estoque/queries";

export const metadata: Metadata = {
  title: "Lotes e validade — Chef Hub Profissional",
};

interface LotesPageProps {
  searchParams: Promise<{ busca?: string; page?: string }>;
}

export default async function LotesPage({ searchParams }: LotesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarLotesEstoque({ busca: params.busca, page });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    query.set("page", String(novaPagina));
    return `/estoque/lotes?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Lotes e validade</Heading>
          <Text tone="muted">
            Lotes ativos consumidos por ordem FIFO — os mais antigos saem
            primeiro.
          </Text>
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />

        <SearchInput
          paramName="busca"
          placeholder="Buscar por ingrediente..."
          className="max-w-xs"
        />

        <LotesTable lotes={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
