import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { CotacaoForm } from "@/features/compras/components/cotacao-form";
import { listarSolicitacoesAprovadasParaCotacao } from "@/features/compras/queries";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";

export const metadata: Metadata = {
  title: "Nova cotação — Chef Hub Profissional",
};

export default async function NovaCotacaoPage() {
  const [ingredientes, fornecedores, solicitacoes] = await Promise.all([
    listarIngredientesAtivosParaSelecao(),
    listarFornecedoresAtivosParaSelecao(),
    listarSolicitacoesAprovadasParaCotacao(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex max-w-3xl flex-col gap-6">
        <Heading level={2}>Nova cotação</Heading>
        <CotacaoForm
          ingredientes={ingredientes}
          fornecedores={fornecedores}
          solicitacoes={solicitacoes}
        />
      </Container>
    </Section>
  );
}
