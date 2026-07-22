import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

import { BI_NAV } from "../bi-nav";
import { dashboardsDoPapel } from "../permissions";
import type { BiComparativoModo, BiDashboardId, BiDrillLevel } from "../types";
import type { BiDashboardData } from "../queries";
import { BiComparativo } from "./bi-comparativo";
import { BiDrilldown } from "./bi-drilldown";
import { BiExportLinks } from "./bi-export-links";
import { BiFilters } from "./bi-filters";
import { BiKpiGrid } from "./bi-kpi-grid";
import { BiMetasPanel } from "./bi-metas-panel";

const TITULOS: Record<BiDashboardId, string> = {
  visao_geral: "Visão geral da empresa",
  financeiro: "BI Financeiro",
  vendas: "BI Vendas",
  delivery: "BI Delivery",
  salao: "BI Salão",
  estoque: "BI Estoque",
  crm: "BI CRM",
  kds: "BI KDS",
  funcionarios: "BI Funcionários",
  metas: "Metas executivas",
};

export function BiShell({
  dashboard,
  papel,
  data,
  path,
  search,
}: {
  dashboard: BiDashboardId;
  papel: PapelEmpresa;
  data: BiDashboardData;
  path: string;
  search: {
    dataInicio: string;
    dataFim: string;
    comparativo: BiComparativoModo;
    drill?: BiDrillLevel;
    unidadeId?: string;
    categoriaId?: string;
    produtoId?: string;
  };
}) {
  const allowed = new Set(dashboardsDoPapel(papel));
  const links = BI_NAV.filter((l) => allowed.has(l.id)).map((l) => ({
    href: l.href,
    label: l.label,
    exact: l.href === "/bi",
  }));

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <ModuleSubNav links={links} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading level={2}>{TITULOS[dashboard]}</Heading>
            <Text tone="muted">
              Indicadores consolidados · {data.periodo.inicio} a{" "}
              {data.periodo.fim}
            </Text>
          </div>
          <BiExportLinks
            dashboard={dashboard}
            dataInicio={search.dataInicio}
            dataFim={search.dataFim}
          />
        </div>

        <BiFilters
          actionPath={path}
          dataInicio={search.dataInicio}
          dataFim={search.dataFim}
          comparativo={search.comparativo}
        />

        <BiKpiGrid kpis={data.kpis} />

        <div className="grid gap-4 lg:grid-cols-2">
          <BiComparativo label={data.comparativoLabel} itens={data.comparativos} />
          <BiMetasPanel metas={data.metas} />
        </div>

        {(dashboard === "visao_geral" ||
          dashboard === "vendas" ||
          dashboard === "financeiro" ||
          dashboard === "delivery") && (
          <BiDrilldown
            nodes={data.drill}
            level={data.drillLevel}
            basePath={path}
            searchParams={{
              dataInicio: search.dataInicio,
              dataFim: search.dataFim,
              comparativo: search.comparativo,
              unidadeId: search.unidadeId,
              categoriaId: search.categoriaId,
              produtoId: search.produtoId,
            }}
          />
        )}

        {dashboard === "delivery" && data.porCanal.length > 0 && (
          <div className="border-border rounded-lg border p-4">
            <Text weight="semibold">Receita por canal</Text>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {data.porCanal.map((c) => (
                <li key={c.canalId ?? "x"} className="flex justify-between gap-2">
                  <span>{c.nome}</span>
                  <span className="text-muted-foreground">
                    {c.receita.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    · {c.qtd} pedidos
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {dashboard === "funcionarios" && data.funcionarios.porCargo.length > 0 && (
          <div className="border-border rounded-lg border p-4">
            <Text weight="semibold">Por cargo</Text>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {data.funcionarios.porCargo.map((c) => (
                <li key={c.cargo} className="flex justify-between gap-2">
                  <span>{c.cargo}</span>
                  <span className="text-muted-foreground">{c.qtd}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </Section>
  );
}
