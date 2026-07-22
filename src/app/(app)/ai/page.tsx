import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { AiCopilot } from "@/features/ai/components/ai-copilot";
import { podeUsarChefHubAi } from "@/features/ai/permissions";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { caminhoCasaDoPapel } from "@/server/auth/permissoes-rota";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export const metadata: Metadata = {
  title: "ChefHub AI — Chef Hub Profissional",
};

export default async function ChefHubAiPage() {
  await requireEmpresaAtual();
  const papel = await getPapelNaEmpresaAtual();
  if (!papel || !podeUsarChefHubAi(papel)) {
    redirect(papel ? caminhoCasaDoPapel(papel) : "/dashboard");
  }

  return (
    <Section className="py-8">
      <Container className="flex max-w-3xl flex-col gap-6">
        <div>
          <Heading level={2}>ChefHub AI</Heading>
          <Text tone="muted">
            Copiloto de gestão em linguagem natural. Respostas fundamentadas
            apenas nos dados do seu restaurante (ERP + BI) — com explicação das
            fontes.
          </Text>
          <Text size="sm" tone="muted" className="mt-2">
            Complementa o{" "}
            <Link href="/bi" className="text-primary underline-offset-2 hover:underline">
              BI executivo
            </Link>
            . Próximo passo: automações inteligentes (Sprint 21).
          </Text>
        </div>

        <AiCopilot />
      </Container>
    </Section>
  );
}
