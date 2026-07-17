"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import {
  calcularMargemContribuicaoReal,
  calcularPrecoParaMargemAlvo,
  canalParaCustoVariavelAgregado,
  combinarCustosVariaveis,
  margemAlvoImplicitaPercentual,
  type CustoVariavelAgregado,
} from "../calculations";
import type { FichaTecnicaParaFinanceiro } from "../queries";
import { TIPO_CANAL_OPCOES } from "../validation";

export interface PrecificacaoPorCanalProps {
  fichas: FichaTecnicaParaFinanceiro[];
  canais: Tables<"canais_venda">[];
  custosVariaveisGerais: CustoVariavelAgregado;
}

const TIPO_LABEL = Object.fromEntries(
  TIPO_CANAL_OPCOES.map((opcao) => [opcao.value, opcao.label]),
);

function statusMargem(
  margemPercentual: number | null,
  margemAlvoPercentual: number | null,
): { label: string; variant: "success" | "warning" | "danger" | "outline" } {
  if (margemPercentual === null) return { label: "Sem preço definido", variant: "outline" };
  if (margemPercentual <= 0) return { label: "No vermelho", variant: "danger" };
  if (margemAlvoPercentual !== null && margemPercentual < margemAlvoPercentual) {
    return { label: "Abaixo da meta", variant: "warning" };
  }
  return { label: "Saudável", variant: "success" };
}

export function PrecificacaoPorCanal({
  fichas,
  canais,
  custosVariaveisGerais,
}: PrecificacaoPorCanalProps) {
  const [fichaId, setFichaId] = useState<string | null>(null);
  const ficha = fichas.find((item) => item.id === fichaId);
  const canaisAtivos = useMemo(() => canais.filter((canal) => canal.ativo), [canais]);

  const linhas = useMemo(() => {
    if (!ficha) return [];

    const precoAtual = ficha.preco_venda_praticado ?? ficha.preco_sugerido;
    const margemAlvoPercentual = margemAlvoImplicitaPercentual(
      ficha.custo_por_porcao,
      ficha.preco_sugerido,
    );

    return canaisAtivos.map((canal) => {
      const combinado = combinarCustosVariaveis(
        custosVariaveisGerais,
        canalParaCustoVariavelAgregado(canal),
      );

      const margemNoPrecoAtual =
        precoAtual !== null
          ? calcularMargemContribuicaoReal(ficha.custo_por_porcao, precoAtual, combinado)
          : null;

      const precoSugerido =
        margemAlvoPercentual !== null
          ? calcularPrecoParaMargemAlvo(
              ficha.custo_por_porcao,
              margemAlvoPercentual,
              combinado,
            )
          : null;

      return {
        canal,
        precoSugerido,
        margemNoPrecoAtual,
      };
    });
  }, [ficha, canaisAtivos, custosVariaveisGerais]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preço e margem por canal</CardTitle>
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

        {!ficha && (
          <Text tone="muted" size="sm">
            Selecione uma ficha técnica para comparar o preço em cada canal.
          </Text>
        )}

        {ficha && canaisAtivos.length === 0 && (
          <EmptyState
            title="Nenhum canal de venda ativo"
            description="Cadastre iFood, 99Food, Keeta, Delivery Próprio ou um canal personalizado."
          />
        )}

        {ficha && canaisAtivos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Preço sugerido no canal</TableHead>
                <TableHead>Margem no preço atual</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map(({ canal, precoSugerido, margemNoPrecoAtual }) => {
                const status = statusMargem(
                  margemNoPrecoAtual?.margemPercentual ?? null,
                  margemAlvoImplicitaPercentual(ficha.custo_por_porcao, ficha.preco_sugerido),
                );

                return (
                  <TableRow key={canal.id}>
                    <TableCell className="text-foreground font-medium">
                      {canal.nome}
                      <Text as="span" tone="muted" size="sm" className="ml-2">
                        {TIPO_LABEL[canal.tipo] ?? canal.tipo}
                      </Text>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarPercentual(canal.taxa_percentual)}
                      {canal.taxa_fixa > 0 && ` + ${formatarMoeda(canal.taxa_fixa)}`}
                    </TableCell>
                    <TableCell>
                      {precoSugerido !== null ? formatarMoeda(precoSugerido) : "—"}
                    </TableCell>
                    <TableCell>
                      {margemNoPrecoAtual ? (
                        <Text size="sm" weight="medium">
                          {formatarMoeda(margemNoPrecoAtual.margemUnitaria)} (
                          {formatarPercentual(margemNoPrecoAtual.margemPercentual)})
                        </Text>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
