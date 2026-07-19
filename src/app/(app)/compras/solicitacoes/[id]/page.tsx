import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { AnexosList } from "@/features/fornecedores/components/anexos-list";
import { listarAnexos } from "@/features/fornecedores/queries";
import { SolicitacaoAcoes } from "@/features/compras/components/solicitacao-acoes";
import {
  PRIORIDADE_LABEL,
  PRIORIDADE_VARIANT,
  SOLICITACAO_STATUS_LABEL,
  SOLICITACAO_STATUS_VARIANT,
} from "@/features/compras/components/status-badges";
import {
  buscarSolicitacaoPorId,
  listarAprovacoesSolicitacao,
  listarHistoricoSolicitacao,
  podeAprovarSolicitacao,
} from "@/features/compras/queries";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";
import { formatarData, formatarDataHora, formatarDecimal, formatarMoeda } from "@/lib/format";

interface SolicitacaoPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Solicitação de compra — Chef Hub Profissional",
};

const ACAO_LABEL: Record<string, string> = {
  aprovar: "Aprovou",
  rejeitar: "Rejeitou",
  solicitar_ajuste: "Solicitou ajuste",
};

export default async function SolicitacaoPage({
  params,
}: SolicitacaoPageProps) {
  const { id } = await params;
  const [solicitacao, fornecedores, historico, aprovacoes, podeAprovar, anexos] =
    await Promise.all([
      buscarSolicitacaoPorId(id),
      listarFornecedoresAtivosParaSelecao(),
      listarHistoricoSolicitacao(id),
      listarAprovacoesSolicitacao(id),
      podeAprovarSolicitacao(id),
      listarAnexos("solicitacao_compra", id),
    ]);

  if (!solicitacao) {
    notFound();
  }

  const valorEstimado = solicitacao.solicitacoes_compra_itens.reduce(
    (soma, item) => soma + item.quantidade * (item.preco_estimado ?? 0),
    0,
  );

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Heading level={2}>
                Solicitação de compra {solicitacao.numero ? `#${solicitacao.numero}` : ""}
              </Heading>
              <Badge variant={SOLICITACAO_STATUS_VARIANT[solicitacao.status]}>
                {SOLICITACAO_STATUS_LABEL[solicitacao.status] ??
                  solicitacao.status}
              </Badge>
              <Badge variant={PRIORIDADE_VARIANT[solicitacao.prioridade]}>
                {PRIORIDADE_LABEL[solicitacao.prioridade] ?? solicitacao.prioridade}
              </Badge>
            </div>
            <Text tone="muted">
              Criada em {formatarDataHora(solicitacao.criado_em)}
              {solicitacao.setor && ` · Setor: ${solicitacao.setor}`}
              {solicitacao.centros_custo && ` · CC: ${solicitacao.centros_custo.nome}`}
              {solicitacao.data_necessaria &&
                ` · Necessária até ${formatarData(solicitacao.data_necessaria)}`}
            </Text>
            {solicitacao.justificativa && (
              <Text size="sm" className="mt-1">
                <Text as="span" weight="semibold">
                  Justificativa:
                </Text>{" "}
                {solicitacao.justificativa}
              </Text>
            )}
            {solicitacao.observacao && (
              <Text size="sm" tone="muted">
                {solicitacao.observacao}
              </Text>
            )}
          </div>

          <SolicitacaoAcoes
            solicitacaoId={solicitacao.id}
            status={solicitacao.status}
            fornecedores={fornecedores}
            podeAprovar={podeAprovar}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço estimado</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacao.solicitacoes_compra_itens.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-foreground font-medium">
                  {item.ingredientes.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatarDecimal(item.quantidade)}{" "}
                  {item.ingredientes.unidades_medida.sigla}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.preco_estimado ? formatarMoeda(item.preco_estimado) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-right">
                  {formatarMoeda(item.quantidade * (item.preco_estimado ?? 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {valorEstimado > 0 && (
          <Text size="sm" tone="muted" className="text-right">
            Valor total estimado: {formatarMoeda(valorEstimado)}
          </Text>
        )}

        <div>
          <Heading level={3} className="mb-3">
            Documentos
          </Heading>
          <AnexosList
            referenciaTipo="solicitacao_compra"
            referenciaId={solicitacao.id}
            anexos={anexos}
          />
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Histórico
          </Heading>
          <div className="flex flex-col gap-2">
            {aprovacoes.map((aprovacao) => (
              <div key={aprovacao.id} className="border-border rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Text size="sm" weight="medium">
                    {ACAO_LABEL[aprovacao.acao] ?? aprovacao.acao}
                    {aprovacao.profiles?.nome_completo &&
                      ` — ${aprovacao.profiles.nome_completo}`}
                  </Text>
                  <Text size="sm" tone="muted">
                    {formatarDataHora(aprovacao.criado_em)}
                  </Text>
                </div>
                {aprovacao.comentario && <Text size="sm">{aprovacao.comentario}</Text>}
              </div>
            ))}
            {historico.map((entrada) => (
              <div key={entrada.id} className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                  {entrada.status_anterior
                    ? `${entrada.status_anterior} → ${entrada.status_novo}`
                    : `Criada como ${entrada.status_novo}`}
                  {entrada.profiles?.nome_completo && ` — ${entrada.profiles.nome_completo}`}
                </span>
                <span>{formatarDataHora(entrada.criado_em)}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
