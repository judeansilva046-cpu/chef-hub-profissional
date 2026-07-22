import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import type { BiComparativoModo } from "../types";

const MODOS: Array<{ id: BiComparativoModo; label: string }> = [
  { id: "hoje_ontem", label: "Hoje × Ontem" },
  { id: "semana_semana", label: "Semana × Semana" },
  { id: "mes_mes", label: "Mês × Mês" },
  { id: "ano_ano", label: "Ano × Ano" },
];

export function BiFilters({
  actionPath,
  dataInicio,
  dataFim,
  comparativo,
}: {
  actionPath: string;
  dataInicio: string;
  dataFim: string;
  comparativo: BiComparativoModo;
}) {
  return (
    <form
      action={actionPath}
      method="get"
      className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label className="flex flex-col gap-1 text-sm">
        <Text size="sm" tone="muted">
          De
        </Text>
        <input
          type="date"
          name="dataInicio"
          defaultValue={dataInicio}
          className="border-border bg-background rounded-md border px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <Text size="sm" tone="muted">
          Até
        </Text>
        <input
          type="date"
          name="dataFim"
          defaultValue={dataFim}
          className="border-border bg-background rounded-md border px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <Text size="sm" tone="muted">
          Comparativo
        </Text>
        <select
          name="comparativo"
          defaultValue={comparativo}
          className="border-border bg-background rounded-md border px-2 py-1.5"
        >
          {MODOS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="sm">
        Atualizar
      </Button>
    </form>
  );
}
