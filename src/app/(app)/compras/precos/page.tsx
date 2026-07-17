import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ComparativoPrecosList } from "@/features/compras/components/comparativo-precos-list";
import { COMPRAS_SUB_NAV_LINKS } from "@/features/compras/components/compras-sub-nav-links";
import { listarComparativoPrecos } from "@/features/compras/queries";
import { listarFornecedoresAtivosParaSelecao } from "@/features/fornecedores/queries";

export const metadata: Metadata = {
  title: "Comparativo de preços — Chef Hub Profissional",
};

interface PrecosPageProps {
  searchParams: Promise<{ busca?: string }>;
}

export default async function PrecosPage({ searchParams }: PrecosPageProps) {
  const params = await searchParams;

  const [ingredientes, fornecedores] = await Promise.all([
    listarComparativoPrecos({ busca: params.busca }),
    listarFornecedoresAtivosParaSelecao(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Comparativo de preços</Heading>
          <Text tone="muted">
            Preço de cada ingrediente por fornecedor — o mais barato é
            sugerido automaticamente na lista inteligente de compras.
          </Text>
        </div>

        <ModuleSubNav links={COMPRAS_SUB_NAV_LINKS} />

        <SearchInput
          paramName="busca"
          placeholder="Buscar ingrediente..."
          className="max-w-xs"
        />

        <ComparativoPrecosList
          ingredientes={ingredientes}
          fornecedores={fornecedores}
        />
      </Container>
    </Section>
  );
}
