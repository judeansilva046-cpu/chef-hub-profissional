import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { buscarCaixaDetalhado } from "@/features/caixa/queries";
import { formatarDataHora, formatarMoeda } from "@/lib/format";

export const metadata: Metadata = {
  title: "Caixa — Chef Hub Profissional",
};

interface CaixaDetalhePageProps {
  params: Promise<{ id: string }>;
}

const TIPO_MOVIMENTACAO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  sangria: "Sangria",
  suprimento: "Suprimento",
  venda: "Venda",
};

export default async function CaixaDetalhePage({ params }: CaixaDetalhePageProps) {
  const { id } = await params;
  const detalhe = await buscarCaixaDetalhado(id);
  if (!detalhe) notFound();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Heading level={2}>Caixa — {detalhe.caixa.profiles?.nome_completo ?? "—"}</Heading>
          <Badge variant={detalhe.caixa.status === "aberto" ? "success" : "outline"}>
            {detalhe.caixa.status === "aberto" ? "Aberto" : "Fechado"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Saldo inicial
            </Text>
            <Text weight="semibold">{formatarMoeda(detalhe.caixa.saldo_inicial)}</Text>
          </div>
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Saldo esperado
            </Text>
            <Text weight="semibold">
              {detalhe.caixa.saldo_esperado !== null ? formatarMoeda(detalhe.caixa.saldo_esperado) : "—"}
            </Text>
          </div>
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Saldo informado
            </Text>
            <Text weight="semibold">
              {detalhe.caixa.saldo_informado !== null ? formatarMoeda(detalhe.caixa.saldo_informado) : "—"}
            </Text>
          </div>
          <div className="border-border rounded-lg border p-3">
            <Text size="sm" tone="muted">
              Diferença
            </Text>
            <Text weight="semibold">
              {detalhe.caixa.diferenca !== null ? formatarMoeda(detalhe.caixa.diferenca) : "—"}
            </Text>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Text weight="medium">Movimentações</Text>
          {detalhe.movimentacoes.length === 0 ? (
            <Text tone="muted" size="sm">
              Nenhuma movimentação registrada.
            </Text>
          ) : (
            <div className="flex flex-col gap-1">
              {detalhe.movimentacoes.map((mov) => (
                <div key={mov.id} className="flex justify-between text-sm">
                  <Text tone="muted">
                    {TIPO_MOVIMENTACAO_LABEL[mov.tipo] ?? mov.tipo}
                    {mov.observacao ? ` — ${mov.observacao}` : ""} · {formatarDataHora(mov.criado_em)}
                  </Text>
                  <Text>{formatarMoeda(mov.valor)}</Text>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
