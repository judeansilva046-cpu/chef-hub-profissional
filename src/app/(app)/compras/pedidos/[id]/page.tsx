import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { PedidoAcoes } from "@/features/compras/components/pedido-acoes";
import { PedidoItensTable } from "@/features/compras/components/pedido-itens-table";
import { PEDIDO_STATUS_LABEL, PEDIDO_STATUS_VARIANT } from "@/features/compras/components/status-badges";
import {
  buscarPedidoPorId,
  listarHistoricoPedido,
  listarRecebimentosPedido,
} from "@/features/compras/queries";
import { formatarData, formatarDataHora, formatarDecimal, formatarMoeda } from "@/lib/format";

interface PedidoPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Pedido de compra — Chef Hub Profissional",
};

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { id } = await params;
  const [pedido, historico, recebimentos] = await Promise.all([
    buscarPedidoPorId(id),
    listarHistoricoPedido(id),
    listarRecebimentosPedido(id),
  ]);

  if (!pedido) {
    notFound();
  }

  const podeReceber = pedido.status !== "cancelado";
  const desconto =
    pedido.desconto_valor_fixo + (pedido.subtotal * pedido.desconto_percentual) / 100;

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Heading level={2}>
                Pedido {pedido.numero ? `#${pedido.numero}` : ""} — {pedido.fornecedores.nome}
              </Heading>
              <Badge variant={PEDIDO_STATUS_VARIANT[pedido.status]}>
                {PEDIDO_STATUS_LABEL[pedido.status] ?? pedido.status}
              </Badge>
            </div>
            <Text tone="muted">
              Pedido em {formatarData(pedido.data_pedido)}
              {pedido.data_prevista_entrega &&
                ` · Previsão de entrega: ${formatarData(pedido.data_prevista_entrega)}`}
              {pedido.centros_custo && ` · CC: ${pedido.centros_custo.nome}`}
              {pedido.solicitacoes_compra && ` · Origem: solicitação #${pedido.solicitacoes_compra.numero}`}
              {pedido.compras_cotacoes && ` · Origem: cotação #${pedido.compras_cotacoes.numero}`}
              {pedido.observacao && ` · ${pedido.observacao}`}
            </Text>
            {pedido.aprovado_em && (
              <Text tone="muted" size="sm">
                Aprovado em {formatarDataHora(pedido.aprovado_em)}
              </Text>
            )}
          </div>

          <PedidoAcoes pedidoId={pedido.id} status={pedido.status} />
        </div>

        <PedidoItensTable
          pedidoId={pedido.id}
          itens={pedido.pedidos_compra_itens}
          podeReceber={podeReceber}
        />

        <Card className="max-w-sm self-end">
          <CardContent className="flex flex-col gap-1 pt-6 text-sm">
            <div className="flex justify-between">
              <Text tone="muted">Subtotal</Text>
              <Text>{formatarMoeda(pedido.subtotal)}</Text>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between">
                <Text tone="muted">Desconto</Text>
                <Text>-{formatarMoeda(desconto)}</Text>
              </div>
            )}
            {pedido.valor_frete > 0 && (
              <div className="flex justify-between">
                <Text tone="muted">Frete</Text>
                <Text>{formatarMoeda(pedido.valor_frete)}</Text>
              </div>
            )}
            {pedido.valor_impostos > 0 && (
              <div className="flex justify-between">
                <Text tone="muted">Impostos</Text>
                <Text>{formatarMoeda(pedido.valor_impostos)}</Text>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <Text weight="semibold">Total</Text>
              <Text weight="semibold">{formatarMoeda(pedido.total)}</Text>
            </div>
            {pedido.condicao_pagamento && (
              <Text tone="muted" size="sm" className="mt-2">
                Pagamento: {pedido.condicao_pagamento}
                {pedido.numero_parcelas > 1 && ` em ${pedido.numero_parcelas}x`}
              </Text>
            )}
          </CardContent>
        </Card>

        {recebimentos.length > 0 && (
          <div>
            <Heading level={3} className="mb-3">
              Recebimentos
            </Heading>
            <div className="flex flex-col gap-3">
              {recebimentos.map((recebimento) => (
                <div key={recebimento.id} className="border-border rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text size="sm" weight="medium">
                      {formatarData(recebimento.data_recebimento)}
                      {recebimento.profiles?.nome_completo && ` — ${recebimento.profiles.nome_completo}`}
                    </Text>
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {recebimento.compras_recebimentos_itens.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <Text as="span" size="sm">
                          {item.pedidos_compra_itens.ingredientes.nome}
                        </Text>
                        {item.quantidade_recebida > 0 && (
                          <Text as="span" size="sm" tone="muted">
                            recebido: {formatarDecimal(item.quantidade_recebida)}
                          </Text>
                        )}
                        {item.quantidade_recusada > 0 && (
                          <Text as="span" size="sm" tone="danger">
                            recusado: {formatarDecimal(item.quantidade_recusada)}
                          </Text>
                        )}
                        {item.divergencia && (
                          <Badge variant="warning">Divergência</Badge>
                        )}
                        {item.numero_lote && (
                          <Text as="span" size="sm" tone="muted">
                            lote {item.numero_lote}
                          </Text>
                        )}
                      </div>
                    ))}
                    {recebimento.compras_recebimentos_itens.some((item) => item.motivo_divergencia) && (
                      <Text size="sm" tone="muted" className="mt-1">
                        {recebimento.compras_recebimentos_itens
                          .map((item) => item.motivo_divergencia)
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {historico.length > 0 && (
          <div>
            <Heading level={3} className="mb-3">
              Histórico
            </Heading>
            <div className="flex flex-col gap-2">
              {historico.map((entrada) => (
                <div key={entrada.id} className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    {entrada.status_anterior
                      ? `${entrada.status_anterior} → ${entrada.status_novo}`
                      : `Criado como ${entrada.status_novo}`}
                    {entrada.profiles?.nome_completo && ` — ${entrada.profiles.nome_completo}`}
                  </span>
                  <span>{formatarDataHora(entrada.criado_em)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
