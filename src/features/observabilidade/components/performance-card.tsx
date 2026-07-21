import { Text } from "@/components/ui/text";
import { formatarDataHora } from "@/lib/format";

export type PerformanceSample = {
  id: string;
  tipo: string;
  nome: string;
  duracao_ms: number;
  criado_em: string;
};

export function PerformanceCard({ samples }: { samples: PerformanceSample[] }) {
  if (samples.length === 0) {
    return (
      <Text tone="muted" size="sm">
        Nenhuma amostra lenta registrada (≥300ms).
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {samples.map((s) => (
        <li
          key={s.id}
          className="border-border flex items-center justify-between gap-2 border-b py-2 last:border-0"
        >
          <div>
            <Text size="sm" weight="medium">
              {s.tipo}: {s.nome}
            </Text>
            <Text size="sm" tone="muted">
              {formatarDataHora(s.criado_em)}
            </Text>
          </div>
          <Text
            size="sm"
            weight="semibold"
            tone={s.duracao_ms >= 1000 ? "danger" : "warning"}
          >
            {s.duracao_ms} ms
          </Text>
        </li>
      ))}
    </ul>
  );
}
