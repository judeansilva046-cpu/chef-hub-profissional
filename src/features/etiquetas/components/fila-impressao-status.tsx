import { AlertTriangle, Clock, Loader } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

import type { ResumoFilaImpressao } from "../queries";

export interface FilaImpressaoStatusProps {
  resumo: ResumoFilaImpressao;
}

export function FilaImpressaoStatus({ resumo }: FilaImpressaoStatusProps) {
  const cards = [
    { icon: Clock, label: "Pendentes", value: resumo.pendentes },
    { icon: Loader, label: "Processando", value: resumo.processando },
    { icon: AlertTriangle, label: "Com erro", value: resumo.erro },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Fila de impressão — {card.label}
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
