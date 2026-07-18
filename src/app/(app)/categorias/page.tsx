import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { CategoriasIngredientesManager } from "@/features/categorias-ingredientes/components/categorias-ingredientes-manager";
import { listarCategoriasIngredientes } from "@/features/categorias-ingredientes/queries";

export const metadata: Metadata = {
  title: "Categorias — Chef Hub Profissional",
};

export default async function CategoriasPage() {
  const categorias = await listarCategoriasIngredientes();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Categorias de ingredientes</Heading>
          <Text tone="muted">
            Organize os ingredientes em grupos para facilitar a busca e os
            filtros.
          </Text>
        </div>

        <CategoriasIngredientesManager categorias={categorias} />
      </Container>
    </Section>
  );
}
