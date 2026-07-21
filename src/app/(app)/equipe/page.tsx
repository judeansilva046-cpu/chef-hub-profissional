import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { EquipeManager } from "@/features/equipe/components/equipe-manager";
import { listarMembrosEmpresa } from "@/features/equipe/queries";
import {
  getPapelNaEmpresaAtual,
} from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export const metadata: Metadata = {
  title: "Equipe — Chef Hub Profissional",
};

export default async function EquipePage() {
  const empresa = await requireEmpresaAtual();
  const [membros, papel] = await Promise.all([
    listarMembrosEmpresa(),
    getPapelNaEmpresaAtual(),
  ]);

  const podeGerir = papel === "owner" || papel === "gerente";

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Equipe</Heading>
          <Text tone="muted">
            Gerencie operadores da empresa com papéis (owner, gerente, caixa,
            cozinha, garçom).
          </Text>
        </div>

        <EquipeManager
          membros={membros}
          podeGerir={podeGerir}
          ownerUsuarioId={empresa.usuario_id}
        />
      </Container>
    </Section>
  );
}
