import { Text } from "@/components/ui/text";

import { formatBiValue } from "../calculations";
import type { BiMetaProgresso } from "../types";

const TIPO_LABEL: Record<string, string> = {
  faturamento: "Faturamento",
  lucro: "Lucro",
  cmv: "CMV",
  ticket_medio: "Ticket médio",
  vendas: "Vendas",
  desperdicio: "Desperdício",
};

export function BiMetasPanel({ metas }: { metas: BiMetaProgresso[] }) {
  if (metas.length === 0) {
    return (
      <div className="border-border rounded-lg border p-4">
        <Text weight="semibold">Metas</Text>
        <Text size="sm" tone="muted" className="mt-1">
          Nenhuma meta ativa no período. Cadastre em BI → Metas.
        </Text>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <Text weight="semibold">Progresso das metas</Text>
      <ul className="mt-3 flex flex-col gap-3">
        {metas.map((m) => {
          const fmt =
            m.unidade === "percent"
              ? "percent"
              : m.unidade === "qty" || m.unidade === "kg"
                ? "number"
                : "currency";
          const pct = Math.min(100, Math.max(0, m.progressoPct));
          return (
            <li key={m.id}>
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span>{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                <span className="text-muted-foreground">
                  {formatBiValue(m.valorAtual, fmt)} /{" "}
                  {formatBiValue(m.valorMeta, fmt)} ({m.progressoPct}%)
                  {m.invertida ? " · menor é melhor" : ""}
                </span>
              </div>
              <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
