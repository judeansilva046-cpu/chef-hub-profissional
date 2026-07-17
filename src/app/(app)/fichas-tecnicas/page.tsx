import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { FichasTecnicasFiltroStatus } from "@/features/fichas-tecnicas/components/fichas-tecnicas-filtro-status";
import { FichasTecnicasTable } from "@/features/fichas-tecnicas/components/fichas-tecnicas-table";
import { listarFichasTecnicas } from "@/features/fichas-tecnicas/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fichas técnicas — Chef Hub Profissional",
};

interface FichasTecnicasPageProps {
  searchParams: Promise<{
    busca?: string;
    ativo?: "true" | "false" | "todos";
    page?: string;
  }>;
}

export default async function FichasTecnicasPage({
  searchParams,
}: FichasTecnicasPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const resultado = await listarFichasTecnicas({
    busca: params.busca,
    ativo: params.ativo ?? "true",
    page,
  });

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.busca) query.set("busca", params.busca);
    if (params.ativo) query.set("ativo", params.ativo);
    query.set("page", String(novaPagina));
    return `/fichas-tecnicas?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Fichas técnicas</Heading>
            <Text tone="muted">
              CMV, margem de contribuição e markup calculados automaticamente a
              partir do custo dos ingredientes.
            </Text>
          </div>
          <Link
            href="/fichas-tecnicas/nova"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="h-4 w-4" />
            Nova ficha técnica
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            paramName="busca"
            placeholder="Buscar ficha técnica..."
            className="max-w-xs"
          />
          <FichasTecnicasFiltroStatus />
        </div>

        <FichasTecnicasTable fichas={resultado.data} />

        <Pagination
          page={resultado.page}
          totalPages={resultado.totalPages}
          createHref={createHref}
        />
      </Container>
    </Section>
  );
}
