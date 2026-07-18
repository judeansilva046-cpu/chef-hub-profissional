import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { AgentesImpressaoManager } from "@/features/etiquetas/components/agentes-impressao-manager";
import { EtiquetasHistoricoTable } from "@/features/etiquetas/components/etiquetas-historico-table";
import { FilaImpressaoStatus } from "@/features/etiquetas/components/fila-impressao-status";
import { NovaEtiquetaButton } from "@/features/etiquetas/components/nova-etiqueta-button";
import {
  buscarResumoFilaImpressao,
  listarAgentesImpressao,
  listarEtiquetasEmitidas,
  listarLotesParaEtiqueta,
} from "@/features/etiquetas/queries";

export const metadata: Metadata = {
  title: "Etiquetas de validade — Chef Hub Profissional",
};

interface EtiquetasPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function EtiquetasPage({ searchParams }: EtiquetasPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const [lotes, etiquetas, agentes, resumoFila] = await Promise.all([
    listarLotesParaEtiqueta(),
    listarEtiquetasEmitidas({ page }),
    listarAgentesImpressao(),
    buscarResumoFilaImpressao(),
  ]);

  function createHref(novaPagina: number) {
    return `/estoque/etiquetas?page=${novaPagina}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Etiquetas de validade</Heading>
            <Text tone="muted">
              Emissão a partir dos lotes de estoque — imprime via fila
              consumida por um agente local instalado no computador da
              impressora térmica.
            </Text>
          </div>
          <NovaEtiquetaButton lotes={lotes} />
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />

        <FilaImpressaoStatus resumo={resumoFila} />

        <div>
          <Heading level={3} className="mb-3">
            Histórico de emissão
          </Heading>
          <EtiquetasHistoricoTable etiquetas={etiquetas.data} />
          <div className="mt-4">
            <Pagination
              page={etiquetas.page}
              totalPages={etiquetas.totalPages}
              createHref={createHref}
            />
          </div>
        </div>

        <AgentesImpressaoManager agentes={agentes} />
      </Container>
    </Section>
  );
}
