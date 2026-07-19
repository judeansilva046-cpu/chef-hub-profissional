import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { SolicitacaoForm } from "@/features/compras/components/solicitacao-form";
import { listarCentrosCusto } from "@/features/financeiro/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";

export const metadata: Metadata = {
  title: "Nova solicitação de compra — Chef Hub Profissional",
};

export default async function NovaSolicitacaoPage() {
  const [ingredientes, centrosCusto] = await Promise.all([
    listarIngredientesAtivosParaSelecao(),
    listarCentrosCusto(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex max-w-3xl flex-col gap-6">
        <Heading level={2}>Nova solicitação de compra</Heading>
        <SolicitacaoForm ingredientes={ingredientes} centrosCusto={centrosCusto} />
      </Container>
    </Section>
  );
}
