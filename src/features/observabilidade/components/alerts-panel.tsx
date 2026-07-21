import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

import type { SystemAlertRow } from "../queries";

export function AlertsPanel({ alerts }: { alerts: SystemAlertRow[] }) {
  if (alerts.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhum alerta aberto.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {alerts.map((alerta) => (
        <li key={alerta.id} className="border-border border-b pb-2 last:border-0">
          <div className="flex flex-wrap items-center gap-2">
            <Text
              size="sm"
              weight="semibold"
              tone={
                alerta.severidade === "critical" || alerta.severidade === "error"
                  ? "danger"
                  : alerta.severidade === "warning"
                    ? "warning"
                    : "info"
              }
            >
              {alerta.severidade}
            </Text>
            <Text size="sm" tone="muted">
              {alerta.tipo}
            </Text>
            <Text size="sm" tone="muted">
              {formatarDataHora(alerta.criado_em)}
            </Text>
          </div>
          <Text size="sm" weight="medium">
            {alerta.titulo}
          </Text>
          <Text size="sm" tone="muted">
            {alerta.mensagem}
          </Text>
        </li>
      ))}
    </ul>
  );
}
