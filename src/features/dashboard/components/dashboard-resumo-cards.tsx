import { Landmark, Percent, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

export interface DashboardResumoCardsProps {
  faturamentoRealizado: number;
  faturamentoProjetado: number | null;
  cmvPercentual: number | null;
  margemPercentual: number | null;
  lucroEstimado: number;
  pontoEquilibrioReceita: number | null;
}

export function DashboardResumoCards({
  faturamentoRealizado,
  faturamentoProjetado,
  cmvPercentual,
  margemPercentual,
  lucroEstimado,
  pontoEquilibrioReceita,
}: DashboardResumoCardsProps) {
  const cards = [
    {
      icon: Wallet,
      label: "Faturamento realizado",
      value: formatarMoeda(faturamentoRealizado),
    },
    {
      icon: Target,
      label: "Faturamento projetado (meta)",
      value: faturamentoProjetado !== null ? formatarMoeda(faturamentoProjetado) : "—",
    },
    {
      icon: TrendingDown,
      label: "CMV realizado",
      value: cmvPercentual !== null ? formatarPercentual(cmvPercentual) : "—",
    },
    {
      icon: Percent,
      label: "Margem de contribuição realizada",
      value: margemPercentual !== null ? formatarPercentual(margemPercentual) : "—",
    },
    {
      icon: TrendingUp,
      label: "Lucro estimado (margem − custos fixos)",
      value: formatarMoeda(lucroEstimado),
    },
    {
      icon: Landmark,
      label: "Ponto de equilíbrio (faturamento)",
      value: pontoEquilibrioReceita !== null ? formatarMoeda(pontoEquilibrioReceita) : "—",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
