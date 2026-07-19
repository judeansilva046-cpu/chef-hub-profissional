import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { COMPRAS_SUB_NAV_LINKS } from "@/features/compras/components/compras-sub-nav-links";
import { buscarIndicadoresDashboardCompras } from "@/features/compras/dashboard";
import { formatarDecimal, formatarMoeda, formatarPercentual } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard de compras — Chef Hub Profissional",
};

function CardIndicador({ titulo, valor, subtitulo }: { titulo: string; valor: string; subtitulo?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Text className="text-2xl font-semibold">{valor}</Text>
        {subtitulo && (
          <Text tone="muted" size="sm">
            {subtitulo}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardComprasPage() {
  const indicadores = await buscarIndicadoresDashboardCompras(30);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Compras</Heading>
          <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} className="mt-3" />
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Últimos 30 dias
          </Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <CardIndicador titulo="Total comprado" valor={formatarMoeda(indicadores.totalComprasPeriodo)} />
            <CardIndicador titulo="Pedidos" valor={formatarDecimal(indicadores.quantidadePedidosPeriodo)} />
            <CardIndicador titulo="Ticket médio" valor={formatarMoeda(indicadores.ticketMedioPedido)} />
            <CardIndicador
              titulo="Economia em cotações"
              valor={formatarMoeda(indicadores.economiaEmCotacoes)}
              subtitulo={`${indicadores.cotacoesFinalizadasPeriodo} cotação(ões) finalizada(s)`}
            />
            <CardIndicador
              titulo="Divergências no recebimento"
              valor={formatarDecimal(indicadores.divergenciasRecebimentoPeriodo)}
            />
          </div>
        </div>

        <div>
          <Heading level={3} className="mb-3">
            Pendências
          </Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <CardIndicador titulo="Solicitações aguardando decisão" valor={formatarDecimal(indicadores.solicitacoesPendentes)} />
            <CardIndicador titulo="Pedidos aguardando aprovação" valor={formatarDecimal(indicadores.pedidosAguardandoAprovacao)} />
            <CardIndicador titulo="Pedidos com entrega atrasada" valor={formatarDecimal(indicadores.pedidosAtrasados)} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Heading level={3} className="mb-3">
              Compras por fornecedor
            </Heading>
            {indicadores.comprasPorFornecedor.length === 0 ? (
              <EmptyState title="Nenhuma compra no período" />
            ) : (
              <div className="flex flex-col gap-2">
                {indicadores.comprasPorFornecedor.map((f) => (
                  <div key={f.fornecedorId} className="border-border flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <Text weight="medium">{f.fornecedorNome}</Text>
                      <Text tone="muted" size="sm">
                        {f.quantidadePedidos} pedido(s)
                      </Text>
                    </div>
                    <Text weight="semibold">{formatarMoeda(f.total)}</Text>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Heading level={3} className="mb-3">
              Compras por categoria
            </Heading>
            {indicadores.comprasPorCategoria.length === 0 ? (
              <EmptyState title="Nenhuma compra no período" />
            ) : (
              <div className="flex flex-col gap-2">
                {indicadores.comprasPorCategoria.map((c) => (
                  <div key={c.categoria} className="border-border flex items-center justify-between rounded-lg border p-3 text-sm">
                    <Text weight="medium">{c.categoria}</Text>
                    <Text weight="semibold">{formatarMoeda(c.total)}</Text>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Heading level={3} className="mb-3">
              Melhores fornecedores (score geral)
            </Heading>
            {indicadores.melhoresFornecedores.length === 0 ? (
              <EmptyState title="Nenhuma avaliação registrada ainda" />
            ) : (
              <div className="flex flex-col gap-2">
                {indicadores.melhoresFornecedores.map((f) => (
                  <div key={f.fornecedorId} className="border-border flex items-center justify-between rounded-lg border p-3 text-sm">
                    <Text weight="medium">{f.fornecedorNome}</Text>
                    <div className="flex items-center gap-2">
                      {f.taxaEntregaCompleta !== null && (
                        <Badge variant="outline">{formatarPercentual(f.taxaEntregaCompleta)} entrega completa</Badge>
                      )}
                      <Text weight="semibold">{formatarDecimal(f.scoreGeral)} / 5</Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Heading level={3} className="mb-3">
              Maiores aumentos de preço (90 dias)
            </Heading>
            {indicadores.maioresAumentos.length === 0 ? (
              <EmptyState title="Nenhuma variação de preço registrada" />
            ) : (
              <div className="flex flex-col gap-2">
                {indicadores.maioresAumentos.map((v, index) => (
                  <div key={`${v.ingredienteId}-${index}`} className="border-border flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <Text weight="medium">{v.ingredienteNome}</Text>
                      <Text tone="muted" size="sm">
                        {v.fornecedorNome} · {formatarMoeda(v.precoAnterior)} → {formatarMoeda(v.precoAtual)}
                      </Text>
                    </div>
                    <Badge variant="danger">+{formatarPercentual(v.variacaoPercentual)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
