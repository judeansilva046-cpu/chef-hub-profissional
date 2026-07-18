import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { listarClientesAtivosParaSelecao } from "@/features/clientes/queries";
import { listarCanaisVenda } from "@/features/financeiro/queries";
import { NovoPedidoForm } from "@/features/pedidos/components/novo-pedido-form";

export const metadata: Metadata = {
  title: "Novo pedido — Chef Hub Profissional",
};

export default async function NovoPedidoPage() {
  const [clientes, canais] = await Promise.all([
    listarClientesAtivosParaSelecao(),
    listarCanaisVenda(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex max-w-xl flex-col gap-6">
        <div>
          <Heading level={2}>Novo pedido</Heading>
          <Text tone="muted">
            Crie o pedido e, na tela seguinte, adicione os itens, ajuste valores e confirme.
          </Text>
        </div>

        <NovoPedidoForm clientes={clientes} canais={canais} />
      </Container>
    </Section>
  );
}
