import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FichaTecnicaForm } from "@/features/fichas-tecnicas/components/ficha-tecnica-form";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";
import { listarUnidadesMedida } from "@/features/unidades-medida/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "Nova ficha técnica — Chef Hub Profissional",
};

export default async function NovaFichaTecnicaPage() {
  const [ingredientes, unidadesMedida, empresa] = await Promise.all([
    listarIngredientesAtivosParaSelecao(),
    listarUnidadesMedida(),
    getEmpresaAtual(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <Heading level={2}>Nova ficha técnica</Heading>

        <FichaTecnicaForm
          ingredientes={ingredientes}
          unidadesMedida={unidadesMedida}
          margemContribuicaoPadraoEmpresa={
            empresa?.margem_contribuicao_padrao ?? null
          }
        />
      </Container>
    </Section>
  );
}
