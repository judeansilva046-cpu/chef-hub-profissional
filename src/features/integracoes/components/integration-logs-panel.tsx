import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

export function IntegrationLogsPanel({
  logs,
}: {
  logs: Array<{
    id: string;
    level: string;
    event_type: string;
    message: string;
    created_at: string;
    duration_ms?: number | null;
  }>;
}) {
  if (logs.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Sem logs recentes.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {logs.map((log) => (
        <li key={log.id} className="border-border border-b pb-2 last:border-0">
          <div className="flex flex-wrap gap-2">
            <Text
              size="sm"
              weight="semibold"
              tone={
                log.level === "ERROR" || log.level === "CRITICAL"
                  ? "danger"
                  : log.level === "WARNING"
                    ? "warning"
                    : "muted"
              }
            >
              {log.level}
            </Text>
            <Text size="sm" tone="muted">
              {log.event_type}
            </Text>
            <Text size="sm" tone="muted">
              {formatarDataHora(log.created_at)}
            </Text>
            {log.duration_ms != null ? (
              <Text size="sm" tone="muted">
                {log.duration_ms}ms
              </Text>
            ) : null}
          </div>
          <Text size="sm">{log.message}</Text>
        </li>
      ))}
    </ul>
  );
}
