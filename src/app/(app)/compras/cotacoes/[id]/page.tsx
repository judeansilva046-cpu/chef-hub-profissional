import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CotacaoDetalhe } from "@/features/compras/components/cotacao-detalhe";
import { COTACAO_STATUS_LABEL, COTACAO_STATUS_VARIANT } from "@/features/compras/components/status-badges";
import { buscarCotacaoPorId } from "@/features/compras/queries";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";
import { formatarDataHora } from "@/lib/format";

interface CotacaoPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Cotação — Chef Hub Profissional",
};

export default async function CotacaoPage({ params }: CotacaoPageProps) {
  const { id } = await params;
  const [cotacao, fornecedoresDisponiveis] = await Promise.all([
    buscarCotacaoPorId(id),
    listarFornecedoresAtivosParaSelecao(),
  ]);

  if (!cotacao) {
    notFound();
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Heading level={2}>Cotação {cotacao.numero ? `#${cotacao.numero}` : ""}</Heading>
            <Badge variant={COTACAO_STATUS_VARIANT[cotacao.status]}>
              {COTACAO_STATUS_LABEL[cotacao.status] ?? cotacao.status}
            </Badge>
          </div>
          <Text tone="muted">
            Criada em {formatarDataHora(cotacao.criadoEm)}
            {cotacao.solicitacaoOrigem && ` · Origem: solicitação #${cotacao.solicitacaoOrigem.numero}`}
            {cotacao.observacao && ` · ${cotacao.observacao}`}
          </Text>
          {cotacao.status === "finalizada" && (
            <Text size="sm" className="mt-1">
              Vencedor:{" "}
              {cotacao.fornecedores.find((f) => f.fornecedorId === cotacao.fornecedorVencedorId)?.fornecedorNome}
              {cotacao.escolhaAutomatica ? " (escolha automática — menor custo total)" : ""}
              {cotacao.justificativaEscolha && ` — ${cotacao.justificativaEscolha}`}
            </Text>
          )}
        </div>

        <CotacaoDetalhe cotacao={cotacao} fornecedoresDisponiveis={fornecedoresDisponiveis} />
      </Container>
    </Section>
  );
}
