import Link from "next/link";
import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import {
  calcularMargemContribuicaoReal,
  calcularMargemNecessariaPercentual,
  mesAtualReferencia,
} from "@/features/financeiro/calculations";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import type { LinhaPrecificacao } from "@/features/financeiro/components/precificacao-table";
import { PrecificacaoTable } from "@/features/financeiro/components/precificacao-table";
import { PrecificacaoPorCanal } from "@/features/financeiro/components/precificacao-por-canal";
import {
  buscarMetaVendasDoMes,
  calcularCustosFixosTotais,
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
  listarFichasComCustoDesatualizado,
  listarFichasTecnicasParaFinanceiro,
} from "@/features/financeiro/queries";
import { formatarMesAno, formatarPercentual } from "@/lib/format";

export const metadata: Metadata = {
  title: "Precificação — Chef Hub Profissional",
};

export default async function PrecificacaoPage() {
  const mesAtual = mesAtualReferencia();

  const [fichas, custosVariaveis, custosFixosTotais, meta, fichasDesatualizadas, canais] =
    await Promise.all([
      listarFichasTecnicasParaFinanceiro(),
      calcularCustosVariaveisAgregados(),
      calcularCustosFixosTotais(),
      buscarMetaVendasDoMes(mesAtual),
      listarFichasComCustoDesatualizado(),
      listarCanaisVenda(),
    ]);

  const idsComCustoDesatualizado = new Set(
    fichasDesatualizadas.map((item) => item.fichaTecnicaId),
  );

  const margemNecessariaPercentual = calcularMargemNecessariaPercentual(
    custosFixosTotais,
    meta?.valor_meta_receita ?? null,
  );

  const linhas: LinhaPrecificacao[] = fichas.map((ficha) => {
    const precoReferencia = ficha.preco_venda_praticado ?? ficha.preco_sugerido;
    return {
      id: ficha.id,
      nome: ficha.nome,
      custoPorPorcao: ficha.custo_por_porcao,
      precoReferencia,
      margem: calcularMargemContribuicaoReal(
        ficha.custo_por_porcao,
        precoReferencia,
        custosVariaveis,
      ),
      custoDesatualizado: idsComCustoDesatualizado.has(ficha.id),
    };
  });

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Precificação</Heading>
          <Text tone="muted">
            Margem de contribuição real de cada ficha técnica, já descontando
            custos variáveis da venda — além do custo direto de ingredientes.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        {margemNecessariaPercentual !== null ? (
          <Text tone="muted">
            Com a meta de {formatarMesAno(mesAtual)}, cada venda precisa de,
            em média,{" "}
            <Text as="span" weight="semibold" tone="default">
              {formatarPercentual(margemNecessariaPercentual)}
            </Text>{" "}
            de margem de contribuição para cobrir os custos fixos do mês.
          </Text>
        ) : (
          <Text tone="muted">
            Cadastre uma{" "}
            <Link href="/financeiro/metas-vendas" className="text-primary hover:underline">
              meta de vendas
            </Link>{" "}
            para ver a margem de contribuição mínima necessária.
          </Text>
        )}

        <PrecificacaoTable
          linhas={linhas}
          margemNecessariaPercentual={margemNecessariaPercentual}
        />

        <PrecificacaoPorCanal
          fichas={fichas}
          canais={canais}
          custosVariaveisGerais={custosVariaveis}
        />
      </Container>
    </Section>
  );
}
