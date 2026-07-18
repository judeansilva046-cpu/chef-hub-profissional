import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { SearchInput } from "@/components/ui/search-input";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { ESTOQUE_SUB_NAV_LINKS } from "@/features/estoque/components/estoque-sub-nav-links";
import { EstoqueResumoCards } from "@/features/estoque/components/estoque-resumo-cards";
import { NovaMovimentacaoDialog } from "@/features/estoque/components/nova-movimentacao-dialog";
import { SaldoEstoqueTable } from "@/features/estoque/components/saldo-estoque-table";
import { buscarResumoEstoque, listarSaldosEstoque } from "@/features/estoque/queries";
import { listarIngredientesAtivosParaSelecao } from "@/features/ingredientes/queries";

export const metadata: Metadata = {
  title: "Estoque — Chef Hub Profissional",
};

interface EstoquePageProps {
  searchParams: Promise<{ busca?: string }>;
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
  const params = await searchParams;

  const [resumo, saldos, ingredientes] = await Promise.all([
    buscarResumoEstoque(),
    listarSaldosEstoque({ busca: params.busca }),
    listarIngredientesAtivosParaSelecao(),
  ]);

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Heading level={2}>Controle de estoque</Heading>
            <Text tone="muted">
              Saldo por ingrediente, alertas de estoque mínimo e validade
              próxima.
            </Text>
          </div>
          <NovaMovimentacaoDialog ingredientes={ingredientes} />
        </div>

        <ModuleSubNav links={ESTOQUE_SUB_NAV_LINKS} />

        <EstoqueResumoCards resumo={resumo} />

        <SearchInput
          paramName="busca"
          placeholder="Buscar ingrediente..."
          className="max-w-xs"
        />

        <SaldoEstoqueTable saldos={saldos} />
      </Container>
    </Section>
  );
}
