import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { VersoesTimeline } from "@/features/fichas-tecnicas/components/versoes-timeline";
import {
  buscarFichaTecnicaPorId,
  listarVersoesFichaTecnica,
} from "@/features/fichas-tecnicas/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Histórico de versões — Chef Hub Profissional",
};

interface VersoesFichaTecnicaPageProps {
  params: Promise<{ id: string }>;
}

export default async function VersoesFichaTecnicaPage({
  params,
}: VersoesFichaTecnicaPageProps) {
  const { id } = await params;

  const [ficha, versoes] = await Promise.all([
    buscarFichaTecnicaPorId(id),
    listarVersoesFichaTecnica(id),
  ]);

  if (!ficha) {
    notFound();
  }

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Link
            href={`/fichas-tecnicas/${ficha.id}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-2",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a ficha
          </Link>
          <Heading level={2}>Histórico de versões</Heading>
          <Text tone="muted">{ficha.nome}</Text>
        </div>

        <VersoesTimeline versoes={versoes} />
      </Container>
    </Section>
  );
}
