import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { FichaTecnicaForm } from "@/features/fichas-tecnicas/components/ficha-tecnica-form";
import { buscarFichaTecnicaPorId } from "@/features/fichas-tecnicas/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";
import { listarUnidadesMedida } from "@/features/unidades-medida/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "Editar ficha técnica — Chef Hub Profissional",
};

interface EditarFichaTecnicaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarFichaTecnicaPage({
  params,
}: EditarFichaTecnicaPageProps) {
  const { id } = await params;

  const [ficha, ingredientes, unidadesMedida, empresa] = await Promise.all([
    buscarFichaTecnicaPorId(id),
    listarIngredientesAtivosParaSelecao(),
    listarUnidadesMedida(),
    getEmpresaAtual(),
  ]);

  if (!ficha) {
    notFound();
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <Heading level={2}>Editar ficha técnica</Heading>

        <FichaTecnicaForm
          ficha={ficha}
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
