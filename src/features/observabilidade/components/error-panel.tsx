import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

import type { SystemLogRow } from "../queries";

export function ErrorPanel({ logs }: { logs: SystemLogRow[] }) {
  const errors = logs.filter(
    (l) => l.nivel === "ERROR" || l.nivel === "CRITICAL",
  );

  if (errors.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhum erro recente.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {errors.map((log) => (
        <li key={log.id} className="border-border border-b pb-2 last:border-0">
          <div className="flex flex-wrap items-center gap-2">
            <Text
              size="sm"
              weight="semibold"
              tone={log.nivel === "CRITICAL" ? "danger" : "warning"}
            >
              {log.nivel}
            </Text>
            <Text size="sm" tone="muted">
              {log.modulo}
            </Text>
            <Text size="sm" tone="muted">
              {formatarDataHora(log.criado_em)}
            </Text>
          </div>
          <Text size="sm">{log.mensagem}</Text>
        </li>
      ))}
    </ul>
  );
}
