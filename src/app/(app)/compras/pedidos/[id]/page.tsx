import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { PedidoAcoes } from "@/features/compras/components/pedido-acoes";
import { PedidoItensTable } from "@/features/compras/components/pedido-itens-table";
import { PEDIDO_STATUS_LABEL, PEDIDO_STATUS_VARIANT } from "@/features/compras/components/status-badges";
import { buscarPedidoPorId } from "@/features/compras/queries";
import { formatarData } from "@/lib/format";

interface PedidoPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Pedido de compra — Chef Hub Profissional",
};

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { id } = await params;
  const pedido = await buscarPedidoPorId(id);

  if (!pedido) {
    notFound();
  }

  const podeReceber = pedido.status !== "cancelado";

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Heading level={2}>{pedido.fornecedores.nome}</Heading>
              <Badge variant={PEDIDO_STATUS_VARIANT[pedido.status]}>
                {PEDIDO_STATUS_LABEL[pedido.status] ?? pedido.status}
              </Badge>
            </div>
            <Text tone="muted">
              Pedido em {formatarData(pedido.data_pedido)}
              {pedido.data_prevista_entrega &&
                ` · Previsão de entrega: ${formatarData(pedido.data_prevista_entrega)}`}
              {pedido.observacao && ` · ${pedido.observacao}`}
            </Text>
          </div>

          <PedidoAcoes pedidoId={pedido.id} status={pedido.status} />
        </div>

        <PedidoItensTable
          pedidoId={pedido.id}
          itens={pedido.pedidos_compra_itens}
          podeReceber={podeReceber}
        />
      </Container>
    </Section>
  );
}
