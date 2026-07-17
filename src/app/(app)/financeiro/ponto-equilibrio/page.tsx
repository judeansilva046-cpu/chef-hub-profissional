import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import {
  calcularMargemContribuicaoReal,
  calcularPontoEquilibrioReceita,
  calcularPontoEquilibrioUnidades,
} from "@/features/financeiro/calculations";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import type { LinhaPontoEquilibrioProduto } from "@/features/financeiro/components/ponto-equilibrio-produto-table";
import { PontoEquilibrioProdutoTable } from "@/features/financeiro/components/ponto-equilibrio-produto-table";
import { PontoEquilibrioResumo } from "@/features/financeiro/components/ponto-equilibrio-resumo";
import {
  calcularCustosFixosTotais,
  calcularCustosVariaveisAgregados,
  listarFichasTecnicasParaFinanceiro,
} from "@/features/financeiro/queries";

export const metadata: Metadata = {
  title: "Ponto de equilíbrio — Chef Hub Profissional",
};

export default async function PontoEquilibrioPage() {
  const [fichas, custosVariaveis, custosFixosTotais] = await Promise.all([
    listarFichasTecnicasParaFinanceiro(),
    calcularCustosVariaveisAgregados(),
    calcularCustosFixosTotais(),
  ]);

  const margens = fichas.map((ficha) => ({
    ficha,
    margem: calcularMargemContribuicaoReal(
      ficha.custo_por_porcao,
      ficha.preco_venda_praticado ?? ficha.preco_sugerido,
      custosVariaveis,
    ),
  }));

  const margensValidas = margens
    .map((item) => item.margem)
    .filter((margem) => margem !== null);

  const margemContribuicaoMediaPercentual =
    margensValidas.length > 0
      ? margensValidas.reduce((total, margem) => total + margem.margemPercentual, 0) /
        margensValidas.length
      : null;

  const pontoEquilibrioReceita = calcularPontoEquilibrioReceita(
    custosFixosTotais,
    margemContribuicaoMediaPercentual,
  );

  const linhasPorProduto: LinhaPontoEquilibrioProduto[] = margens.map(
    ({ ficha, margem }) => ({
      id: ficha.id,
      nome: ficha.nome,
      unidadeSigla: ficha.unidades_medida.sigla,
      margemUnitaria: margem?.margemUnitaria ?? null,
      unidadesNecessarias: calcularPontoEquilibrioUnidades(
        custosFixosTotais,
        margem?.margemUnitaria ?? null,
      ),
    }),
  );

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Ponto de equilíbrio</Heading>
          <Text tone="muted">
            Quanto sua empresa precisa faturar por mês para cobrir os custos
            fixos — no geral e por produto.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <PontoEquilibrioResumo
          custosFixosTotais={custosFixosTotais}
          margemContribuicaoMediaPercentual={margemContribuicaoMediaPercentual}
          pontoEquilibrioReceita={pontoEquilibrioReceita}
        />

        <Text tone="muted" size="sm">
          Unidades necessárias por produto = quantas vendas daquele item
          sozinho cobririam os custos fixos do mês, se fosse o único produto
          vendido.
        </Text>

        <PontoEquilibrioProdutoTable linhas={linhasPorProduto} />
      </Container>
    </Section>
  );
}
