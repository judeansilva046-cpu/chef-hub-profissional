import { Text } from "@/components/ui/text";

import { formatBiValue } from "../calculations";
import type { BiComparativoItem } from "../types";

export function BiComparativo({
  label,
  itens,
}: {
  label: string;
  itens: BiComparativoItem[];
}) {
  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <Text weight="semibold">{label}</Text>
      <ul className="mt-3 flex flex-col gap-2">
        {itens.map((item) => (
          <li
            key={item.label}
            className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <span>{item.label}</span>
            <span className="text-muted-foreground">
              {formatBiValue(item.atual, item.format)}{" "}
              <span className="opacity-70">
                (ant. {formatBiValue(item.anterior, item.format)})
              </span>{" "}
              {item.deltaPct != null ? (
                <span
                  className={
                    item.deltaPct >= 0 ? "text-emerald-600" : "text-destructive"
                  }
                >
                  {item.deltaPct >= 0 ? "+" : ""}
                  {item.deltaPct}%
                </span>
              ) : (
                <span>—</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
