import { Landmark, Target, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";

export interface PainelResumoCardsProps {
  custosFixosTotais: number;
  pontoEquilibrioReceita: number | null;
  metaReceita: number | null;
  valorEmEstoque: number;
}

export function PainelResumoCards({
  custosFixosTotais,
  pontoEquilibrioReceita,
  metaReceita,
  valorEmEstoque,
}: PainelResumoCardsProps) {
  const cards = [
    {
      icon: Landmark,
      label: "Custos fixos do mês",
      value: formatarMoeda(custosFixosTotais),
    },
    {
      icon: TrendingUp,
      label: "Ponto de equilíbrio",
      value:
        pontoEquilibrioReceita !== null ? formatarMoeda(pontoEquilibrioReceita) : "—",
    },
    {
      icon: Target,
      label: "Meta de faturamento do mês",
      value: metaReceita !== null ? formatarMoeda(metaReceita) : "—",
    },
    {
      icon: Wallet,
      label: "Valor em estoque",
      value: formatarMoeda(valorEmEstoque),
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
