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
import { SolicitacaoAcoes } from "@/features/compras/components/solicitacao-acoes";
import { SOLICITACAO_STATUS_LABEL, SOLICITACAO_STATUS_VARIANT } from "@/features/compras/components/status-badges";
import { buscarSolicitacaoPorId } from "@/features/compras/queries";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";
import { formatarDataHora, formatarDecimal } from "@/lib/format";

interface SolicitacaoPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Solicitação de compra — Chef Hub Profissional",
};

export default async function SolicitacaoPage({
  params,
}: SolicitacaoPageProps) {
  const { id } = await params;
  const [solicitacao, fornecedores] = await Promise.all([
    buscarSolicitacaoPorId(id),
    listarFornecedoresAtivosParaSelecao(),
  ]);

  if (!solicitacao) {
    notFound();
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Heading level={2}>Solicitação de compra</Heading>
              <Badge variant={SOLICITACAO_STATUS_VARIANT[solicitacao.status]}>
                {SOLICITACAO_STATUS_LABEL[solicitacao.status] ??
                  solicitacao.status}
              </Badge>
            </div>
            <Text tone="muted">
              Criada em {formatarDataHora(solicitacao.criado_em)}
              {solicitacao.observacao && ` · ${solicitacao.observacao}`}
            </Text>
          </div>

          <SolicitacaoAcoes
            solicitacaoId={solicitacao.id}
            status={solicitacao.status}
            fornecedores={fornecedores}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Quantidade</TableHead>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    </Section>
  );
}
