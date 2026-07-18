import { Landmark, Percent, Target, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

export interface PontoEquilibrioResumoProps {
  custosFixosTotais: number;
  margemContribuicaoMediaPercentual: number | null;
  pontoEquilibrioReceita: number | null;
}

export function PontoEquilibrioResumo({
  custosFixosTotais,
  margemContribuicaoMediaPercentual,
  pontoEquilibrioReceita,
}: PontoEquilibrioResumoProps) {
  const cards = [
    {
      icon: Landmark,
      label: "Custos fixos mensais",
      value: formatarMoeda(custosFixosTotais),
    },
    {
      icon: Percent,
      label: "Margem de contribuição média",
      value:
        margemContribuicaoMediaPercentual !== null
          ? formatarPercentual(margemContribuicaoMediaPercentual)
          : "—",
    },
    {
      icon: Target,
      label: "Ponto de equilíbrio (faturamento)",
      value:
        pontoEquilibrioReceita !== null
          ? formatarMoeda(pontoEquilibrioReceita)
          : "—",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.label}
            </CardTitle>
            <card.icon className="text-muted-foreground h-4 w-4 shrink-0" />
          </CardHeader>
          <CardContent>
            <Text className="text-2xl font-semibold">{card.value}</Text>
          </CardContent>
        </Card>
      ))}
      {pontoEquilibrioReceita === null && (
        <Text tone="muted" size="sm" className="sm:col-span-3">
          <TrendingUp className="mr-1 inline h-4 w-4" />
          Cadastre custos fixos e defina preços nas fichas técnicas para
          calcular o ponto de equilíbrio.
        </Text>
      )}
    </div>
  );
}
