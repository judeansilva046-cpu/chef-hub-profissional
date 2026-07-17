import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { UnidadesMedidaManager } from "@/features/unidades-medida/components/unidades-medida-manager";
import { listarUnidadesMedida } from "@/features/unidades-medida/queries";

export const metadata: Metadata = {
  title: "Unidades de medida — Chef Hub Profissional",
};

export default async function UnidadesMedidaPage() {
  const unidades = await listarUnidadesMedida();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Unidades de medida</Heading>
          <Text tone="muted">
            Usadas no cadastro de ingredientes e no rendimento das fichas
            técnicas.
          </Text>
        </div>

        <UnidadesMedidaManager unidades={unidades} />
      </Container>
    </Section>
  );
}
