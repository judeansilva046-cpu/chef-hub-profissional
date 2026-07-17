import { AlertTriangle, CalendarClock, PackageCheck, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";

import type { ResumoEstoque } from "../queries";

export interface EstoqueResumoCardsProps {
  resumo: ResumoEstoque;
}

export function EstoqueResumoCards({ resumo }: EstoqueResumoCardsProps) {
  const cards = [
    {
      icon: PackageCheck,
      label: "Ingredientes em estoque",
      value: resumo.totalIngredientes.toString(),
      tone: "text-foreground",
    },
    {
      icon: AlertTriangle,
      label: "Abaixo do estoque mínimo",
      value: resumo.ingredientesAbaixoDoMinimo.toString(),
      tone:
        resumo.ingredientesAbaixoDoMinimo > 0
          ? "text-danger"
          : "text-foreground",
    },
    {
      icon: CalendarClock,
      label: "Lotes vencendo em 7 dias",
      value: resumo.lotesVencendoEm7Dias.toString(),
      tone:
        resumo.lotesVencendoEm7Dias > 0 ? "text-warning" : "text-foreground",
    },
    {
      icon: Wallet,
      label: "Valor total em estoque",
      value: formatarMoeda(resumo.valorTotalEmEstoque),
      tone: "text-foreground",
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
            <Text className={`text-2xl font-semibold ${card.tone}`}>
              {card.value}
            </Text>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
