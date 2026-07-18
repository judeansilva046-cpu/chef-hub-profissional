import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { MesaDetalhe } from "@/features/mesas/components/mesa-detalhe";
import { buscarMesaDetalhada, listarComandasAbertas, listarMesas } from "@/features/mesas/queries";

export const metadata: Metadata = {
  title: "Mesa — Chef Hub Profissional",
};

interface MesaPageProps {
  params: Promise<{ id: string }>;
}

export default async function MesaPage({ params }: MesaPageProps) {
  const { id } = await params;

  const detalhe = await buscarMesaDetalhada(id);
  if (!detalhe) notFound();

  const [mesas, comandasAbertas] = await Promise.all([
    listarMesas(),
    listarComandasAbertas(detalhe.comandaAberta?.id),
  ]);

  const mesasLivres = mesas.filter((mesa) => mesa.status === "livre" && mesa.id !== id);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <Heading level={2}>{detalhe.mesa.identificador}</Heading>
        <MesaDetalhe detalhe={detalhe} mesasLivres={mesasLivres} comandasAbertas={comandasAbertas} />
      </Container>
    </Section>
  );
}
