import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ExpedicaoBoard } from "@/features/expedicao/components/expedicao-board";
import { NovoEntregadorForm } from "@/features/expedicao/components/novo-entregador-form";
import { listarEntregadoresAtivos, listarExpedicoesAbertas } from "@/features/expedicao/queries";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export const metadata: Metadata = {
  title: "Expedição — Chef Hub Profissional",
};

export default async function ExpedicaoPage() {
  const empresa = await getEmpresaAtual();
  if (!empresa) redirect("/onboarding");

  const [expedicoes, entregadores] = await Promise.all([listarExpedicoesAbertas(), listarEntregadoresAtivos()]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Expedição</Heading>
            <Text tone="muted">Conferência, embalagem, retirada e entrega dos pedidos prontos.</Text>
          </div>
          <NovoEntregadorForm />
        </div>

        <ExpedicaoBoard expedicoes={expedicoes} entregadores={entregadores} empresaId={empresa.id} />
      </Container>
    </Section>
  );
}
