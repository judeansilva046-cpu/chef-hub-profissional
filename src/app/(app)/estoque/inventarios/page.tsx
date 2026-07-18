import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { InventariosTable } from "@/features/estoque/components/inventarios-table";
import { NovoInventarioButton } from "@/features/estoque/components/novo-inventario-button";
import { listarInventarios } from "@/features/estoque/queries";

export const metadata: Metadata = {
  title: "Inventários — Chef Hub Profissional",
};

interface InventariosPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InventariosPage({
  searchParams,
}: InventariosPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarInventarios({ page });

  function createHref(novaPagina: number) {
    return `/estoque/inventarios?page=${novaPagina}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Inventários</Heading>
            <Text tone="muted">
              Contagens físicas de estoque — diferenças geram ajustes
              automáticos ao concluir.
            </Text>
          </div>
          <NovoInventarioButton />
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />

        <InventariosTable inventarios={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
