import { PiggyBank, Receipt, ShoppingBag, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

export interface DashboardFinanceiroResumoCardsProps {
  receitaBruta: number;
  despesasOperacionais: number;
  lucroLiquido: number;
  margemLiquidaPercentual: number | null;
  cmvPercentual: number | null;
  ticketMedio: number | null;
}

export function DashboardFinanceiroResumoCards({
  receitaBruta,
  despesasOperacionais,
  lucroLiquido,
  margemLiquidaPercentual,
  cmvPercentual,
  ticketMedio,
}: DashboardFinanceiroResumoCardsProps) {
  const cards = [
    { icon: Wallet, label: "Receita", value: formatarMoeda(receitaBruta) },
    { icon: Receipt, label: "Despesas (pagas no período)", value: formatarMoeda(despesasOperacionais) },
    {
      icon: lucroLiquido >= 0 ? TrendingUp : TrendingDown,
      label: "Lucro líquido",
      value: formatarMoeda(lucroLiquido),
    },
    {
      icon: PiggyBank,
      label: "Margem líquida",
      value: margemLiquidaPercentual !== null ? formatarPercentual(margemLiquidaPercentual) : "—",
    },
    {
      icon: TrendingDown,
      label: "CMV",
      value: cmvPercentual !== null ? formatarPercentual(cmvPercentual) : "—",
    },
    {
      icon: ShoppingBag,
      label: "Ticket médio",
      value: ticketMedio !== null ? formatarMoeda(ticketMedio) : "—",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">{card.label}</CardTitle>
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
