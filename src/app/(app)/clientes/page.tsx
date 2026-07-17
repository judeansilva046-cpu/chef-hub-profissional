import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ClientesTable } from "@/features/clientes/components/clientes-table";
import { NovoClienteButton } from "@/features/clientes/components/novo-cliente-button";
import { listarClientes } from "@/features/clientes/queries";

export const metadata: Metadata = {
  title: "Clientes — Chef Hub Profissional",
};

interface ClientesPageProps {
  searchParams: Promise<{
    busca?: string;
    ativo?: "true" | "false" | "todos";
    page?: string;
  }>;
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarClientes({
    busca: params.busca,
    ativo: params.ativo ?? "true",
    page,
  });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    if (params.ativo) query.set("ativo", params.ativo);
    query.set("page", String(novaPagina));
    return `/clientes?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Clientes</Heading>
            <Text tone="muted">
              CRM — cadastro, histórico de pedidos, ticket médio e frequência
              de compra (calculados a partir das vendas registradas).
            </Text>
          </div>
          <NovoClienteButton />
        </div>

        <SearchInput
          paramName="busca"
          placeholder="Buscar cliente..."
          className="max-w-xs"
        />

        <ClientesTable clientes={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
