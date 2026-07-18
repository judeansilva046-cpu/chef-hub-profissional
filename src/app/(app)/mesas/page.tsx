import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { MesasGrid } from "@/features/mesas/components/mesas-grid";
import { listarMesas } from "@/features/mesas/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "Mesas — Chef Hub Profissional",
};

export default async function MesasPage() {
  const empresa = await getEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const mesas = await listarMesas();

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Mesas</Heading>
          <Text tone="muted">Abertura de comanda, transferência, união de mesas e divisão de conta.</Text>
        </div>

        <MesasGrid mesas={mesas} empresaId={empresa.id} />
      </Container>
    </Section>
  );
}
