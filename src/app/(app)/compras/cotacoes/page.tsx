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
import { CotacoesFiltroStatus } from "@/features/compras/components/cotacoes-filtro-status";
import { CotacoesTable } from "@/features/compras/components/cotacoes-table";
import { listarCotacoes } from "@/features/compras/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cotações — Chef Hub Profissional",
};

interface CotacoesPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function CotacoesPage({ searchParams }: CotacoesPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarCotacoes({
    status: params.status ?? "todos",
    page,
  });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    query.set("page", String(novaPagina));
    return `/compras/cotacoes?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Cotações</Heading>
            <Text tone="muted">
              Compare propostas de fornecedores e finalize o pedido de compra
              com o melhor custo total.
            </Text>
          </div>
          <Link href="/compras/cotacoes/nova" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="h-4 w-4" />
            Nova cotação
          </Link>
        </div>

        <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} />

        <CotacoesFiltroStatus />

        <CotacoesTable cotacoes={resultado.data} />

        <Pagination page={resultado.page} totalPages={resultado.totalPages} createHref={createHref} />
      </Container>
    </Section>
  );
}
