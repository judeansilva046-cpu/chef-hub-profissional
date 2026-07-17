import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { COMPRAS_SUB_NAV_LINKS } from "@/features/compras/components/compras-sub-nav-links";
import { FornecedoresTable } from "@/features/fornecedores/components/fornecedores-table";
import { NovoFornecedorButton } from "@/features/fornecedores/components/novo-fornecedor-button";
import { listarFornecedores } from "@/features/fornecedores/queries";

export const metadata: Metadata = {
  title: "Fornecedores — Chef Hub Profissional",
};

interface FornecedoresPageProps {
  searchParams: Promise<{
    busca?: string;
    ativo?: "true" | "false" | "todos";
    page?: string;
  }>;
}

export default async function FornecedoresPage({
  searchParams,
}: FornecedoresPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarFornecedores({
    busca: params.busca,
    ativo: params.ativo ?? "true",
    page,
  });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    if (params.ativo) query.set("ativo", params.ativo);
    query.set("page", String(novaPagina));
    return `/compras/fornecedores?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Fornecedores</Heading>
            <Text tone="muted">
              Usados nas solicitações, pedidos de compra e no comparativo de
              preços.
            </Text>
          </div>
          <NovoFornecedorButton />
        </div>

        <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} />

        <SearchInput
          paramName="busca"
          placeholder="Buscar fornecedor..."
          className="max-w-xs"
        />

        <FornecedoresTable fornecedores={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
