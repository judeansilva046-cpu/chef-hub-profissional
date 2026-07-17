import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { listarClientesAtivosParaSelecao } from "@/features/clientes/queries";
import { listarCanaisVenda, listarFichasTecnicasParaFinanceiro } from "@/features/financeiro/queries";
import { NovaVendaButton } from "@/features/vendas/components/nova-venda-button";
import { VendasFiltros } from "@/features/vendas/components/vendas-filtros";
import { VendasTable } from "@/features/vendas/components/vendas-table";
import { listarVendas } from "@/features/vendas/queries";

export const metadata: Metadata = {
  title: "Vendas — Chef Hub Profissional",
};

interface VendasPageProps {
  searchParams: Promise<{
    dataInicio?: string;
    dataFim?: string;
    canalVendaId?: string;
    clienteId?: string;
    page?: string;
  }>;
}

export default async function VendasPage({ searchParams }: VendasPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const [resultado, fichas, canais, clientes] = await Promise.all([
    listarVendas({
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      canalVendaId: params.canalVendaId,
      clienteId: params.clienteId,
      page,
    }),
    listarFichasTecnicasParaFinanceiro(),
    listarCanaisVenda(),
    listarClientesAtivosParaSelecao(),
  ]);

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.dataInicio) query.set("dataInicio", params.dataInicio);
    if (params.dataFim) query.set("dataFim", params.dataFim);
    if (params.canalVendaId) query.set("canalVendaId", params.canalVendaId);
    if (params.clienteId) query.set("clienteId", params.clienteId);
    query.set("page", String(novaPagina));
    return `/vendas?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Vendas</Heading>
            <Text tone="muted">
              Registro de vendas realizadas — alimenta o Dashboard, os
              Relatórios e o histórico de pedidos dos clientes com dados
              reais.
            </Text>
          </div>
          <NovaVendaButton fichas={fichas} canais={canais} clientes={clientes} />
        </div>

        <VendasFiltros canais={canais} />

        <VendasTable
          vendas={resultado.data}
          fichas={fichas}
          canais={canais}
          clientes={clientes}
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
