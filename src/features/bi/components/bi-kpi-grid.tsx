import { Text } from "@/components/ui/text";

import { formatBiValue } from "../calculations";
import type { BiKpi } from "../types";

export function BiKpiGrid({ kpis }: { kpis: BiKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="border-border bg-card rounded-lg border p-3">
          <Text size="sm" tone="muted">
            {kpi.label}
          </Text>
          <Text weight="semibold" className="mt-1 text-xl tracking-tight">
            {formatBiValue(kpi.value, kpi.format)}
          </Text>
          {kpi.deltaPct != null && (
            <Text
              size="sm"
              className={
                kpi.deltaPct >= 0 ? "text-emerald-600" : "text-destructive"
              }
            >
              {kpi.deltaPct >= 0 ? "+" : ""}
              {kpi.deltaPct}% vs período anterior
            </Text>
          )}
          {kpi.hint ? (
            <Text size="sm" tone="muted" className="mt-1">
              {kpi.hint}
            </Text>
          ) : null}
        </div>
      ))}
    </div>
  );
}
