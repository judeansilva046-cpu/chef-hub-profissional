import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { buscarCaixaAbertoDoOperador } from "@/features/caixa/queries";
import { listarImpressaoPorReferencia } from "@/features/impressao/queries";
import { PedidoDetalhe } from "@/features/pedidos/components/pedido-detalhe";
import { buscarPedidoDetalhado, listarFichasTecnicasParaPedido } from "@/features/pedidos/queries";

export const metadata: Metadata = {
  title: "Pedido — Chef Hub Profissional",
};

interface PedidoPageProps {
  params: Promise<{ id: string }>;
}

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { id } = await params;

  const [detalhe, fichas, caixaAberto] = await Promise.all([
    buscarPedidoDetalhado(id),
    listarFichasTecnicasParaPedido(),
    buscarCaixaAbertoDoOperador(),
  ]);

  if (!detalhe) notFound();

  const trabalhosImpressao = await listarImpressaoPorReferencia("pedido", id);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <Heading level={2}>Pedido #{detalhe.pedido.numero}</Heading>
        <PedidoDetalhe detalhe={detalhe} fichas={fichas} caixaAberto={caixaAberto} trabalhosImpressao={trabalhosImpressao} />
      </Container>
    </Section>
  );
}
