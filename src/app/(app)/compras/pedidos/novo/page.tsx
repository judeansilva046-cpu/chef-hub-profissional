import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { PedidoForm } from "@/features/compras/components/pedido-form";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";

export const metadata: Metadata = {
  title: "Novo pedido de compra — Chef Hub Profissional",
};

export default async function NovoPedidoPage() {
  const [ingredientes, fornecedores] = await Promise.all([
    listarIngredientesAtivosParaSelecao(),
    listarFornecedoresAtivosParaSelecao(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex max-w-4xl flex-col gap-6">
        <Heading level={2}>Novo pedido de compra</Heading>
        <PedidoForm ingredientes={ingredientes} fornecedores={fornecedores} />
      </Container>
    </Section>
  );
}
