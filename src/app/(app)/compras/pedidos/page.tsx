import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { COMPRAS_SUB_NAV_LINKS } from "@/features/compras/components/compras-sub-nav-links";
import { PedidosFiltroStatus } from "@/features/compras/components/pedidos-filtro-status";
import { PedidosTable } from "@/features/compras/components/pedidos-table";
import { listarPedidosCompra } from "@/features/compras/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pedidos de compra — Chef Hub Profissional",
};

interface PedidosPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarPedidosCompra({
    status: params.status ?? "todos",
    page,
  });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    query.set("page", String(novaPagina));
    return `/compras/pedidos?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Pedidos de compra</Heading>
            <Text tone="muted">
              Histórico completo de pedidos — receba itens para gerar lotes
              de estoque automaticamente.
            </Text>
          </div>
          <Link
            href="/compras/pedidos/novo"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="h-4 w-4" />
            Novo pedido
          </Link>
        </div>

        <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} />

        <PedidosFiltroStatus />

        <PedidosTable pedidos={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
