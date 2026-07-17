import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { IngredientesFiltros } from "@/features/ingredientes/components/ingredientes-filtros";
import { IngredientesTable } from "@/features/ingredientes/components/ingredientes-table";
import { NovoIngredienteButton } from "@/features/ingredientes/components/novo-ingrediente-button";
import { listarIngredientes } from "@/features/ingredientes/queries";
import { listarCategoriasIngredientes } from "@/features/categorias-ingredientes/queries";
import { listarUnidadesMedida } from "@/features/unidades-medida/queries";

export const metadata: Metadata = {
  title: "Ingredientes — Chef Hub Profissional",
};

interface IngredientesPageProps {
  searchParams: Promise<{
    busca?: string;
    categoria?: string;
    ativo?: "true" | "false" | "todos";
    page?: string;
  }>;
}

export default async function IngredientesPage({
  searchParams,
}: IngredientesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const [resultado, categorias, unidades] = await Promise.all([
    listarIngredientes({
      busca: params.busca,
      categoriaId: params.categoria,
      ativo: params.ativo ?? "true",
      page,
    }),
    listarCategoriasIngredientes(),
    listarUnidadesMedida(),
  ]);

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    if (params.categoria) query.set("categoria", params.categoria);
    if (params.ativo) query.set("ativo", params.ativo);
    query.set("page", String(novaPagina));
    return `/ingredientes?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Ingredientes</Heading>
            <Text tone="muted">
              Custo unitário usado no cálculo automático das fichas técnicas.
            </Text>
          </div>
          <NovoIngredienteButton categorias={categorias} unidades={unidades} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            paramName="busca"
            placeholder="Buscar ingrediente..."
            className="max-w-xs"
          />
          <IngredientesFiltros categorias={categorias} />
        </div>

        <IngredientesTable
          ingredientes={resultado.data}
          categorias={categorias}
          unidades={unidades}
        />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
