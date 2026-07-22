import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";

import type { carregarDashboardCrm } from "../queries";

type Dash = Awaited<ReturnType<typeof carregarDashboardCrm>>;

export function CrmDashboard({ data }: { data: Dash }) {
  const segmentos = "segmentos" in data ? data.segmentos : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading level={2}>CRM e Fidelização</Heading>
        <Text tone="muted">
          Recorrência, ticket médio, pontos, cashback, cupons e campanhas.
        </Text>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total de clientes" value={String(data.totalClientes)} />
        <Kpi label="Novos (30d)" value={String(data.novosClientes)} />
        <Kpi label="Ativos" value={String(data.ativos)} />
        <Kpi label="Inativos" value={String(data.inativos)} />
        <Kpi label="Ticket médio" value={formatarMoeda(data.ticketMedio)} />
        <Kpi label="Frequência média" value={String(data.frequenciaMedia)} />
        <Kpi label="Taxa de retorno" value={`${data.taxaRetorno}%`} />
        <Kpi label="Taxa ativos" value={`${data.taxaAtivos}%`} />
        <Kpi label="Cupons usados" value={String(data.cuponsUsados)} />
        <Kpi label="Pontos emitidos" value={String(data.pontosEmitidos)} />
        <Kpi label="Pontos resgatados" value={String(data.pontosResgatados)} />
        <Kpi label="Cashback concedido" value={formatarMoeda(data.cashbackConcedido)} />
      </div>

      {segmentos && (
        <div className="border-border bg-card rounded-lg border p-4">
          <Text weight="semibold">Segmentação dinâmica</Text>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(segmentos).map(([key, ids]) => (
              <Badge key={key} variant="outline">
                {key}: {ids.length}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text weight="semibold" size="lg">
        {value}
      </Text>
    </div>
  );
}
