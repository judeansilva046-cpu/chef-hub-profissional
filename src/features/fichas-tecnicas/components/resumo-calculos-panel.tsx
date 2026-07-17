import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { ResumoFichaTecnica } from "../calculations";

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const formatoPeso = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});
const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function Metrica({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text
        weight="semibold"
        className={destaque ? "text-primary text-lg" : undefined}
      >
        {valor}
      </Text>
    </div>
  );
}

export function ResumoCalculosPanel({
  resumo,
}: {
  resumo: ResumoFichaTecnica;
}) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumo de custos</CardTitle>
      </CardHeader>
      <CardContent className="divide-border divide-y">
        <Metrica
          label="Peso bruto total"
          valor={`${formatoPeso.format(resumo.pesoBrutoTotal)} kg`}
        />
        <Metrica
          label="Peso líquido total"
          valor={`${formatoPeso.format(resumo.pesoLiquidoTotal)} kg`}
        />
        <Metrica
          label="Custo total"
          valor={formatoMoeda.format(resumo.custoTotal)}
        />
        <Metrica
          label="Custo por porção"
          valor={formatoMoeda.format(resumo.custoPorPorcao)}
          destaque
        />
        <Metrica
          label="Preço sugerido"
          valor={
            resumo.precoSugerido !== null
              ? formatoMoeda.format(resumo.precoSugerido)
              : "—"
          }
        />
        <Metrica
          label="CMV % (Food Cost)"
          valor={
            resumo.cmvPercentual !== null
              ? `${formatoPercentual.format(resumo.cmvPercentual)}%`
              : "—"
          }
        />
        <Metrica
          label="Margem de contribuição"
          valor={
            resumo.margemContribuicaoPercentual !== null
              ? `${formatoPercentual.format(resumo.margemContribuicaoPercentual)}%`
              : "—"
          }
        />
        <Metrica
          label="Markup"
          valor={
            resumo.markupPercentual !== null
              ? `${formatoPercentual.format(resumo.markupPercentual)}%`
              : "—"
          }
        />
      </CardContent>
      <Separator />
      <CardContent>
        <Text size="sm" tone="muted">
          Margem-alvo usada no cálculo:{" "}
          {formatoPercentual.format(resumo.margemAlvoEfetiva)}%
          {resumo.precoReferencia !== null && (
            <>
              {" "}
              · Preço de referência:{" "}
              {formatoMoeda.format(resumo.precoReferencia)}
            </>
          )}
        </Text>
      </CardContent>
    </Card>
  );
}
