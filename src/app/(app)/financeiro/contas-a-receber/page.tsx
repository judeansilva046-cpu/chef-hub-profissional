import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Pagination } from "@/components/ui/pagination";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { listarClientesAtivosParaSelecao } from "@/features/clientes/queries";
import { ContasReceberFiltros } from "@/features/contas-receber/components/contas-receber-filtros";
import { ContasReceberHeaderActions } from "@/features/contas-receber/components/contas-receber-header-actions";
import { ContasReceberTable } from "@/features/contas-receber/components/contas-receber-table";
import { listarContasReceber, resumirContasReceber } from "@/features/contas-receber/queries";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { listarCentrosCusto, listarPlanoContas } from "@/features/financeiro/queries";
import { ExportarRelatorioButtons } from "@/features/relatorios/components/exportar-relatorio-buttons";
import { formatarMoeda } from "@/lib/format";

export const metadata: Metadata = {
  title: "Contas a receber — Chef Hub Profissional",
};

interface ContasReceberPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function ContasReceberPage({ searchParams }: ContasReceberPageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const [resultado, resumo, clientes, planoContas, centrosCusto] = await Promise.all([
    listarContasReceber({ status: params.status, page }),
    resumirContasReceber(),
    listarClientesAtivosParaSelecao(),
    listarPlanoContas(),
    listarCentrosCusto(),
  ]);

  function createHref(novaPagina: number) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    query.set("page", String(novaPagina));
    return `/financeiro/contas-a-receber?${query.toString()}`;
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Contas a receber</Heading>
            <Text tone="muted">Clientes, parcelas e recebimentos por PIX, cartão ou dinheiro.</Text>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ExportarRelatorioButtons tipo="contas-receber" searchParams={{ status: params.status }} />
            <ContasReceberHeaderActions clientes={clientes} planoContas={planoContas} centrosCusto={centrosCusto} />
          </div>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Pendente
            </Text>
            <Text weight="semibold">{formatarMoeda(resumo.totalPendente)}</Text>
          </div>
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Atrasado
            </Text>
            <Text weight="semibold" tone={resumo.totalAtrasado > 0 ? "danger" : "default"}>
              {formatarMoeda(resumo.totalAtrasado)}
            </Text>
          </div>
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Recebido no mês
            </Text>
            <Text weight="semibold">{formatarMoeda(resumo.totalRecebidoNoMes)}</Text>
          </div>
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Parcelas pendentes
            </Text>
            <Text weight="semibold">{resumo.quantidadePendente}</Text>
          </div>
        </div>

        <ContasReceberFiltros />

        <ContasReceberTable contas={resultado.data} />

        <Pagination page={resultado.page} totalPages={resultado.totalPages} createHref={createHref} />
      </Container>
    </Section>
  );
}
