import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ListasTable } from "@/features/lista-compras/components/listas-table";
import { NovaListaButton } from "@/features/lista-compras/components/nova-lista-button";
import { listarListasCompra } from "@/features/lista-compras/queries";

export const metadata: Metadata = {
  title: "Lista inteligente de compras — Chef Hub Profissional",
};

interface ListaComprasPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ListaComprasPage({
  searchParams,
}: ListaComprasPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarListasCompra({ page });

  function createHref(novaPagina: number) {
    return `/lista-compras?page=${novaPagina}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Lista inteligente de compras</Heading>
            <Text tone="muted">
              Gerada automaticamente a partir do planejamento de produção e
              do estoque mínimo, agrupada por fornecedor.
            </Text>
          </div>
          <NovaListaButton />
        </div>

        <ListasTable listas={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
