import { Text } from "@/components/ui/text";

import type { PainelIntegracoesMetrics } from "../metrics";

export function IntegrationMetricsPanel({ metrics }: { metrics: PainelIntegracoesMetrics }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Webhooks (7d)" value={String(metrics.webhooksRecebidos)} />
        <Kpi label="Falhas" value={String(metrics.falhas)} />
        <Kpi label="Retentativas" value={String(metrics.retentativas)} />
        <Kpi
          label="Latência média"
          value={metrics.latenciaMediaMs != null ? `${metrics.latenciaMediaMs} ms` : "—"}
        />
        <Kpi label="DLQ" value={String(metrics.jobsDlq)} />
        <Kpi
          label="Última sync"
          value={
            metrics.ultimaSync
              ? new Date(metrics.ultimaSync).toLocaleString("pt-BR")
              : "—"
          }
        />
      </div>

      {metrics.porProvider.length > 0 && (
        <div className="border-border bg-card rounded-lg border p-4">
          <Text weight="semibold">Uso por integração</Text>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {metrics.porProvider.map((p) => (
              <li key={p.provider} className="flex flex-wrap justify-between gap-2">
                <span>{p.provider}</span>
                <span className="text-muted-foreground">
                  calls {p.calls} · falhas {p.failures} · webhooks {p.webhooks} ·{" "}
                  {p.avgLatencyMs} ms
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text weight="semibold">{value}</Text>
    </div>
  );
}
