import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DashboardMetaRealizadoProps {
  faturamentoRealizado: number;
  faturamentoProjetado: number | null;
}

export function DashboardMetaRealizado({
  faturamentoRealizado,
  faturamentoProjetado,
}: DashboardMetaRealizadoProps) {
  if (faturamentoProjetado === null || faturamentoProjetado <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meta vs. Realizado</CardTitle>
        </CardHeader>
        <CardContent>
          <Text tone="muted" size="sm">
            Cadastre uma meta de vendas no período para comparar com o
            faturamento realizado.
          </Text>
        </CardContent>
      </Card>
    );
  }

  const percentualAtingido = (faturamentoRealizado / faturamentoProjetado) * 100;
  const largura = Math.min(100, Math.max(0, percentualAtingido));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Meta vs. Realizado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <Text weight="semibold">{formatarMoeda(faturamentoRealizado)}</Text>
          <Text tone="muted" size="sm">
            Meta: {formatarMoeda(faturamentoProjetado)}
          </Text>
        </div>
        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              percentualAtingido >= 100 ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${largura}%` }}
          />
        </div>
        <Text tone="muted" size="sm">
          {formatarPercentual(percentualAtingido)} da meta atingida
        </Text>
      </CardContent>
    </Card>
  );
}
