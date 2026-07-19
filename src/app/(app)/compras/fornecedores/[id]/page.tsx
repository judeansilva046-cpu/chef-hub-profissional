import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { AnexosList } from "@/features/fornecedores/components/anexos-list";
import { NovaAvaliacaoForm } from "@/features/fornecedores/components/nova-avaliacao-form";
import {
  buscarFornecedorPorId,
  buscarScoreFornecedor,
  listarAnexos,
  listarAvaliacoesFornecedor,
} from "@/features/fornecedores/queries";
import { formatarData, formatarDecimal, formatarMoeda } from "@/lib/format";

interface FornecedorDetalhePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FornecedorDetalhePageProps): Promise<Metadata> {
  const { id } = await params;
  const fornecedor = await buscarFornecedorPorId(id);
  return { title: `${fornecedor?.nome ?? "Fornecedor"} — Chef Hub Profissional` };
}

export default async function FornecedorDetalhePage({ params }: FornecedorDetalhePageProps) {
  const { id } = await params;
  const [fornecedor, score, avaliacoes, anexos] = await Promise.all([
    buscarFornecedorPorId(id),
    buscarScoreFornecedor(id),
    listarAvaliacoesFornecedor(id),
    listarAnexos("fornecedor", id),
  ]);

  if (!fornecedor) notFound();

  const dadosBancarios = fornecedor.dados_bancarios as
    | { banco?: string; agencia?: string; conta?: string; tipoConta?: string }
    | null;

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Link
            href="/compras/fornecedores"
            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para fornecedores
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Heading level={2}>{fornecedor.nome}</Heading>
            <Badge variant={fornecedor.ativo ? "success" : "outline"}>
              {fornecedor.ativo ? "Ativo" : "Inativo"}
            </Badge>
            {fornecedor.categorias.map((categoria) => (
              <Badge key={categoria} variant="outline">
                {categoria}
              </Badge>
            ))}
          </div>
          {fornecedor.nome_fantasia && (
            <Text tone="muted" size="sm">
              {fornecedor.nome_fantasia}
            </Text>
          )}
          <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
            {fornecedor.telefone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {fornecedor.telefone}
              </span>
            )}
            {fornecedor.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {fornecedor.email}
              </span>
            )}
            {fornecedor.endereco && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {fornecedor.endereco}
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Score geral</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">{formatarDecimal(score?.score_geral ?? 0)} / 5</Text>
              <Text tone="muted" size="sm">
                {score?.total_avaliacoes ?? 0} avaliação(ões)
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Taxa de entrega completa</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">
                {score?.taxa_entrega_completa !== null && score?.taxa_entrega_completa !== undefined
                  ? `${formatarDecimal(score.taxa_entrega_completa)}%`
                  : "—"}
              </Text>
              <Text tone="muted" size="sm">
                {score?.total_pedidos_recebidos ?? 0} pedido(s) recebido(s)
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Prazo médio de entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">
                {fornecedor.prazo_medio_entrega_dias ? `${fornecedor.prazo_medio_entrega_dias}d` : "—"}
              </Text>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Pedido mínimo</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-semibold">
                {fornecedor.pedido_minimo ? formatarMoeda(fornecedor.pedido_minimo) : "—"}
              </Text>
            </CardContent>
          </Card>
        </div>

        {(dadosBancarios?.banco || fornecedor.chave_pix || fornecedor.condicoes_pagamento) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {fornecedor.condicoes_pagamento && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    Condições:
                  </Text>{" "}
                  {fornecedor.condicoes_pagamento}
                </Text>
              )}
              {dadosBancarios?.banco && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    Banco:
                  </Text>{" "}
                  {dadosBancarios.banco} — Ag. {dadosBancarios.agencia} — Conta {dadosBancarios.conta} ({dadosBancarios.tipoConta})
                </Text>
              )}
              {fornecedor.chave_pix && (
                <Text size="sm">
                  <Text as="span" weight="semibold">
                    PIX:
                  </Text>{" "}
                  {fornecedor.chave_pix}
                </Text>
              )}
            </CardContent>
          </Card>
        )}

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <Heading level={3}>Avaliações</Heading>
            <NovaAvaliacaoForm fornecedorId={fornecedor.id} />
          </div>
          {avaliacoes.length === 0 ? (
            <EmptyState title="Nenhuma avaliação registrada" description="Avalie após receber um pedido deste fornecedor." />
          ) : (
            <div className="flex flex-col gap-2">
              {avaliacoes.map((avaliacao) => (
                <div key={avaliacao.id} className="border-border rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text size="sm" weight="medium">
                      Pontualidade {avaliacao.pontualidade} · Qualidade {avaliacao.qualidade} · Preço {avaliacao.preco} · Atendimento {avaliacao.atendimento}
                    </Text>
                    <Text size="sm" tone="muted">
                      {formatarData(avaliacao.criado_em)}
                    </Text>
                  </div>
                  {avaliacao.comentario && <Text size="sm">{avaliacao.comentario}</Text>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Documentos
          </Heading>
          <AnexosList referenciaTipo="fornecedor" referenciaId={fornecedor.id} anexos={anexos} />
        </div>
      </Container>
    </Section>
  );
}
