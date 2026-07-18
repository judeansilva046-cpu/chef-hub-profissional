import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { PedidosFiltros } from "@/features/pedidos/components/pedidos-filtros";
import { PedidosTable } from "@/features/pedidos/components/pedidos-table";
import { listarPedidos } from "@/features/pedidos/queries";

export const metadata: Metadata = {
  title: "Pedidos — Chef Hub Profissional",
};

interface PedidosPageProps {
  searchParams: Promise<{
    status?: string;
    tipo?: string;
    busca?: string;
    page?: string;
  }>;
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarPedidos({
    status: params.status,
    tipo: params.tipo,
    busca: params.busca,
    page,
  });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.tipo) query.set("tipo", params.tipo);
    if (params.busca) query.set("busca", params.busca);
    query.set("page", String(novaPagina));
    return `/pedidos?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Pedidos</Heading>
            <Text tone="muted">
              Balcão, retirada, entrega, consumo local e mesas — histórico completo com status,
              itens, pagamentos e estoque.
            </Text>
          </div>
          <Link href="/pedidos/novo" className={buttonVariants()}>
            Novo pedido
          </Link>
        </div>

        <PedidosFiltros />

        <PedidosTable pedidos={resultado.data} />

        <Pagination page={resultado.page} totalPages={resultado.totalPages} createHref={createHref} />
      </Container>
    </Section>
  );
}
