"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import {
  calcularMargemContribuicaoReal,
  calcularQuantidadeEquivalentePromocao,
  canalParaCustoVariavelAgregado,
  combinarCustosVariaveis,
  type CustoVariavelAgregado,
} from "../calculations";
import type { FichaTecnicaParaFinanceiro } from "../queries";

export interface SimuladorPromocoesFormProps {
  fichas: FichaTecnicaParaFinanceiro[];
  custosVariaveis: CustoVariavelAgregado;
  canais: Tables<"canais_venda">[];
}

export function SimuladorPromocoesForm({
  fichas,
  custosVariaveis,
  canais,
}: SimuladorPromocoesFormProps) {
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [canalId, setCanalId] = useState<string>("");
  const [tipoDesconto, setTipoDesconto] = useState<"percentual" | "valor">(
    "percentual",
  );
  const [valorDesconto, setValorDesconto] = useState<number | null>(null);
  const [quantidadeBase, setQuantidadeBase] = useState<number | null>(10);

  const ficha = fichas.find((item) => item.id === fichaId);
  const canaisAtivos = useMemo(
    () => canais.filter((canal) => canal.ativo),
    [canais],
  );

  const custosVariaveisEfetivos = useMemo(() => {
    const canalSelecionado = canaisAtivos.find((canal) => canal.id === canalId);
    return canalSelecionado
      ? combinarCustosVariaveis(
          custosVariaveis,
          canalParaCustoVariavelAgregado(canalSelecionado),
        )
      : custosVariaveis;
  }, [canaisAtivos, canalId, custosVariaveis]);

  const resultado = useMemo(() => {
    if (!ficha) return null;

    const precoOriginal = ficha.preco_venda_praticado ?? ficha.preco_sugerido;
    if (precoOriginal === null || precoOriginal <= 0) return null;

    const desconto = valorDesconto ?? 0;
    const precoPromocional =
      tipoDesconto === "percentual"
        ? precoOriginal * (1 - desconto / 100)
        : precoOriginal - desconto;

    const margemOriginal = calcularMargemContribuicaoReal(
      ficha.custo_por_porcao,
      precoOriginal,
      custosVariaveisEfetivos,
    );
    const margemPromocional = calcularMargemContribuicaoReal(
      ficha.custo_por_porcao,
      precoPromocional > 0 ? precoPromocional : 0,
      custosVariaveisEfetivos,
    );

    const quantidadeEquivalente =
      margemOriginal && margemPromocional
        ? calcularQuantidadeEquivalentePromocao(
            quantidadeBase ?? 0,
            margemOriginal.margemUnitaria,
            margemPromocional.margemUnitaria,
          )
        : null;

    return {
      precoOriginal,
      precoPromocional,
      margemOriginal,
      margemPromocional,
      quantidadeEquivalente,
    };
  }, [ficha, tipoDesconto, valorDesconto, quantidadeBase, custosVariaveisEfetivos]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Simular promoção</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Ficha técnica</Label>
            <Combobox
              options={fichas.map((item) => ({
                value: item.id,
                label: item.nome,
                description: formatarMoeda(
                  item.preco_venda_praticado ?? item.preco_sugerido ?? 0,
                ),
              }))}
              value={fichaId}
              onValueChange={setFichaId}
              placeholder="Selecionar ficha técnica..."
              searchPlaceholder="Buscar ficha técnica..."
              emptyMessage="Nenhuma ficha técnica ativa encontrada."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="canal">Canal de venda (opcional)</Label>
            <Select
              id="canal"
              value={canalId}
              onChange={(event) => setCanalId(event.target.value)}
            >
              <option value="">Nenhum — só custos variáveis gerais</option>
              {canaisAtivos.map((canal) => (
                <option key={canal.id} value={canal.id}>
                  {canal.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipoDesconto">Tipo de desconto</Label>
              <Select
                id="tipoDesconto"
                value={tipoDesconto}
                onChange={(event) =>
                  setTipoDesconto(event.target.value as "percentual" | "valor")
                }
              >
                <option value="percentual">Percentual (%)</option>
                <option value="valor">Valor fixo (R$)</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorDesconto">
                {tipoDesconto === "percentual" ? "Desconto (%)" : "Desconto (R$)"}
              </Label>
              <NumberField
                id="valorDesconto"
                kind={tipoDesconto === "percentual" ? "percent" : "currency"}
                value={valorDesconto}
                onChange={setValorDesconto}
                min={0}
                max={tipoDesconto === "percentual" ? 100 : undefined}
                placeholder={tipoDesconto === "percentual" ? "0%" : "R$ 0,00"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantidadeBase">Vendas normais no período</Label>
              <NumberField
                id="quantidadeBase"
                value={quantidadeBase}
                onChange={setQuantidadeBase}
                min={0}
                placeholder="Ex: 10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!ficha && (
        <Text tone="muted" size="sm">
          Selecione uma ficha técnica para simular.
        </Text>
      )}

      {ficha && !resultado && (
        <Text tone="danger" size="sm">
          Esta ficha técnica ainda não tem preço sugerido nem praticado
          definido — não é possível simular.
        </Text>
      )}

      {resultado && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preço normal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <Text className="text-2xl font-semibold">
                {formatarMoeda(resultado.precoOriginal)}
              </Text>
              {resultado.margemOriginal && (
                <Text size="sm" tone="muted">
                  Margem: {formatarMoeda(resultado.margemOriginal.margemUnitaria)} (
                  {formatarPercentual(resultado.margemOriginal.margemPercentual)})
                </Text>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preço promocional</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <Text className="text-2xl font-semibold">
                {formatarMoeda(Math.max(0, resultado.precoPromocional))}
              </Text>
              {resultado.margemPromocional && (
                <Text
                  size="sm"
                  tone={
                    resultado.margemPromocional.margemUnitaria <= 0
                      ? "danger"
                      : "muted"
                  }
                >
                  Margem: {formatarMoeda(resultado.margemPromocional.margemUnitaria)} (
                  {formatarPercentual(resultado.margemPromocional.margemPercentual)})
                </Text>
              )}
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Volume necessário para manter o mesmo lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultado.margemPromocional &&
              resultado.margemPromocional.margemUnitaria <= 0 ? (
                <Text tone="danger" size="sm">
                  <AlertTriangle className="mr-1 inline h-4 w-4" />
                  Nesse preço, cada venda dá prejuízo (a margem é zero ou
                  negativa) — nenhum volume de vendas compensa.
                </Text>
              ) : resultado.quantidadeEquivalente !== null ? (
                <Text size="sm">
                  Para manter o mesmo lucro de{" "}
                  <Text as="span" weight="semibold" tone="default">
                    {quantidadeBase ?? 0}
                  </Text>{" "}
                  vendas no preço normal, você precisaria vender{" "}
                  <Text as="span" weight="semibold" tone="default">
                    {Math.ceil(resultado.quantidadeEquivalente)}
                  </Text>{" "}
                  unidades no preço promocional.
                </Text>
              ) : (
                <Text tone="muted" size="sm">
                  Informe a quantidade de vendas normais para comparar.
                </Text>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
