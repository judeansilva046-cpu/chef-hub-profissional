import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarPercentual } from "@/lib/format";

export type NivelSemaforo = "verde" | "amarelo" | "vermelho" | "neutro";

export interface PainelSemaforoProps {
  nivel: NivelSemaforo;
  margemMediaPercentual: number | null;
  margemNecessariaPercentual: number | null;
}

const CONFIG: Record<
  NivelSemaforo,
  { icon: typeof CheckCircle2; cor: string; titulo: string }
> = {
  verde: {
    icon: CheckCircle2,
    cor: "text-success",
    titulo: "Saudável — a margem atual cobre os custos fixos",
  },
  amarelo: {
    icon: AlertTriangle,
    cor: "text-warning",
    titulo: "Atenção — a margem está perto do limite",
  },
  vermelho: {
    icon: XCircle,
    cor: "text-danger",
    titulo: "No vermelho — a margem atual não cobre os custos fixos",
  },
  neutro: {
    icon: HelpCircle,
    cor: "text-muted-foreground",
    titulo: "Cadastre uma meta de vendas para calcular o semáforo",
  },
};

export function PainelSemaforo({
  nivel,
  margemMediaPercentual,
  margemNecessariaPercentual,
}: PainelSemaforoProps) {
  const config = CONFIG[nivel];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-6">
        <config.icon className={`h-10 w-10 shrink-0 ${config.cor}`} />
        <div className="flex flex-col gap-1">
          <Text weight="semibold">{config.titulo}</Text>
          {margemMediaPercentual !== null && margemNecessariaPercentual !== null && (
            <Text size="sm" tone="muted">
              Margem de contribuição média: {formatarPercentual(margemMediaPercentual)}{" "}
              · Necessária: {formatarPercentual(margemNecessariaPercentual)}
            </Text>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
