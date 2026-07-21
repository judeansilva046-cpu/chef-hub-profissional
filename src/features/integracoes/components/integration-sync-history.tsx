import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

export function IntegrationSyncHistory({
  syncs,
}: {
  syncs: Array<{
    id: string;
    sync_type: string;
    status: string;
    started_at: string;
    items_count: number;
    error_message?: string | null;
    duration_ms?: number | null;
  }>;
}) {
  if (syncs.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhuma sincronização registrada.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {syncs.map((sync) => (
        <li key={sync.id} className="border-border border-b pb-2 last:border-0">
          <Text size="sm" weight="medium">
            {sync.sync_type} · {sync.status}
            {sync.items_count ? ` · ${sync.items_count} itens` : ""}
          </Text>
          <Text size="sm" tone="muted">
            {formatarDataHora(sync.started_at)}
            {sync.duration_ms != null ? ` · ${sync.duration_ms}ms` : ""}
          </Text>
          {sync.error_message ? (
            <Text size="sm" tone="danger">
              {sync.error_message}
            </Text>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
