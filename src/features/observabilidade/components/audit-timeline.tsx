import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

import type { TimelineItem } from "../timeline";

export function AuditTimeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhum evento na timeline.
      </Text>
    );
  }

  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="bg-primary absolute top-1.5 -left-[1.3rem] h-2.5 w-2.5 rounded-full" />
          <Text weight="medium" size="sm">
            {item.titulo}
          </Text>
          {item.descricao ? (
            <Text tone="muted" size="sm">
              {item.descricao}
            </Text>
          ) : null}
          <Text tone="muted" size="sm" className="mt-0.5">
            {formatarDataHora(item.criadoEm)}
            {item.papel ? ` · ${item.papel}` : ""}
          </Text>
        </li>
      ))}
    </ol>
  );
}
