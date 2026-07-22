import Link from "next/link";

import { Text } from "@/components/ui/text";

import { formatBiValue } from "../calculations";
import type { BiDrillLevel, BiDrillNode } from "../types";

const NEXT_LEVEL: Record<BiDrillLevel, BiDrillLevel | null> = {
  empresa: "unidade",
  unidade: "categoria",
  categoria: "produto",
  produto: "pedido",
  pedido: null,
};

export function BiDrilldown({
  nodes,
  level,
  basePath,
  searchParams,
}: {
  nodes: BiDrillNode[];
  level: BiDrillLevel;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const next = NEXT_LEVEL[level];

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <Text weight="semibold">
        Drill-down — {level}
        {next ? ` → ${next}` : ""}
      </Text>
      <Text size="sm" tone="muted" className="mt-1">
        Empresa → Unidade (canal) → Categoria (praça) → Produto → Pedido
      </Text>
      <ul className="mt-3 divide-border flex flex-col divide-y">
        {nodes.length === 0 ? (
          <li className="py-2 text-sm">Sem dados no período.</li>
        ) : (
          nodes.map((node) => {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(searchParams)) {
              if (v) params.set(k, v);
            }
            if (next) {
              params.set("drill", next);
              if (level === "unidade") params.set("unidadeId", node.id);
              if (level === "categoria") params.set("categoriaId", node.id);
              if (level === "produto") params.set("produtoId", node.id);
            }
            const href = next ? `${basePath}?${params.toString()}` : null;

            const row = (
              <div className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                <span>{node.label}</span>
                <span className="text-muted-foreground">
                  {formatBiValue(node.receita, "currency")} · {node.pedidos}{" "}
                  linhas
                  {node.margem != null
                    ? ` · margem ${formatBiValue(node.margem, "currency")}`
                    : ""}
                </span>
              </div>
            );

            return (
              <li key={node.id}>
                {href ? (
                  <Link href={href} className="hover:text-primary block">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
