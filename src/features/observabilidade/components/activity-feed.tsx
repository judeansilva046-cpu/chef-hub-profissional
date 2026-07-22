import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

import type { TimelineItem } from "../timeline";

export function ActivityFeed({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Sem atividade recente.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id} className="border-border border-b pb-2 last:border-0">
          <Text size="sm" weight="medium">
            {item.titulo}
          </Text>
          <Text size="sm" tone="muted">
            {formatarDataHora(item.criadoEm)}
            {item.papel ? ` · ${item.papel}` : ""}
            {` · ${item.entidade}`}
          </Text>
        </li>
      ))}
    </ul>
  );
}
