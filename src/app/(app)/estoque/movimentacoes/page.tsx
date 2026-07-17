import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { MovimentacoesFiltroTipo } from "@/features/estoque/components/movimentacoes-filtro-tipo";
import { MovimentacoesTable } from "@/features/estoque/components/movimentacoes-table";
import { NovaMovimentacaoDialog } from "@/features/estoque/components/nova-movimentacao-dialog";
import { listarMovimentacoesEstoque } from "@/features/estoque/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";

export const metadata: Metadata = {
  title: "Movimentações de estoque — Chef Hub Profissional",
};

interface MovimentacoesPageProps {
  searchParams: Promise<{ busca?: string; tipo?: string; page?: string }>;
}

export default async function MovimentacoesPage({
  searchParams,
}: MovimentacoesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const [resultado, ingredientes] = await Promise.all([
    listarMovimentacoesEstoque({
      busca: params.busca,
      tipo: params.tipo ?? "todos",
      page,
    }),
    listarIngredientesAtivosParaSelecao(),
  ]);

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    if (params.tipo) query.set("tipo", params.tipo);
    query.set("page", String(novaPagina));
    return `/estoque/movimentacoes?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Movimentações de estoque</Heading>
            <Text tone="muted">
              Registro completo de entradas, saídas, ajustes e acertos de
              inventário.
            </Text>
          </div>
          <NovaMovimentacaoDialog ingredientes={ingredientes} />
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            paramName="busca"
            placeholder="Buscar por ingrediente..."
            className="max-w-xs"
          />
          <MovimentacoesFiltroTipo />
        </div>

        <MovimentacoesTable movimentacoes={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
