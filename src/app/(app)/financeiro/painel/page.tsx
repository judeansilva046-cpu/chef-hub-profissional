import type { Metadata } from "next";

import { ModuleSubNav } from "@/components/layout/module-sub-nav";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import {
  analisarFichasEmAlerta,
  calcularMargemNecessariaPercentual,
  calcularPontoEquilibrioReceita,
  mesAtualReferencia,
} from "@/features/financeiro/calculations";
import { FINANCEIRO_SUB_NAV_LINKS } from "@/features/financeiro/components/financeiro-sub-nav-links";
import { PainelAlertas } from "@/features/financeiro/components/painel-alertas";
import { PainelResumoCards } from "@/features/financeiro/components/painel-resumo-cards";
import {
  PainelSemaforo,
  type NivelSemaforo,
} from "@/features/financeiro/components/painel-semaforo";
import {
  buscarMetaVendasDoMes,
  calcularCustosFixosTotais,
  calcularCustosVariaveisAgregados,
  listarFichasTecnicasParaFinanceiro,
} from "@/features/financeiro/queries";
import { listarPedidosCompra } from "@/features/compras/queries";
import { buscarResumoEstoque } from "@/features/estoque/queries";
import { getSemanaRange, hojeIso } from "@/features/producao/date-range";
import { listarProducoesPlanejadas } from "@/features/producao/queries";

export const metadata: Metadata = {
  title: "Painel Nunca no Vermelho — Chef Hub Profissional",
};

export default async function PainelFinanceiroPage() {
  const mesAtual = mesAtualReferencia();
  const semanaAtual = getSemanaRange(hojeIso());

  const [
    fichas,
    custosVariaveis,
    custosFixosTotais,
    meta,
    resumoEstoque,
    pedidosRascunho,
    pedidosEnviado,
    pedidosParcial,
    producoesSemana,
  ] = await Promise.all([
    listarFichasTecnicasParaFinanceiro(),
    calcularCustosVariaveisAgregados(),
    calcularCustosFixosTotais(),
    buscarMetaVendasDoMes(mesAtual),
    buscarResumoEstoque(),
    listarPedidosCompra({ status: "rascunho" }),
    listarPedidosCompra({ status: "enviado" }),
    listarPedidosCompra({ status: "parcialmente_recebido" }),
    listarProducoesPlanejadas({
      dataInicio: semanaAtual.inicio,
      dataFim: semanaAtual.fim,
    }),
  ]);

  const margemNecessariaPercentual = calcularMargemNecessariaPercentual(
    custosFixosTotais,
    meta?.valor_meta_receita ?? null,
  );

  const { margemContribuicaoMediaPercentual, fichasNoVermelho, fichasAbaixoDoNecessario } =
    analisarFichasEmAlerta(fichas, custosVariaveis, margemNecessariaPercentual);

  const pontoEquilibrioReceita = calcularPontoEquilibrioReceita(
    custosFixosTotais,
    margemContribuicaoMediaPercentual,
  );

  let nivelSemaforo: NivelSemaforo = "neutro";
  if (margemNecessariaPercentual !== null && margemContribuicaoMediaPercentual !== null) {
    if (margemContribuicaoMediaPercentual >= margemNecessariaPercentual) {
      nivelSemaforo = "verde";
    } else if (margemContribuicaoMediaPercentual >= margemNecessariaPercentual * 0.8) {
      nivelSemaforo = "amarelo";
    } else {
      nivelSemaforo = "vermelho";
    }
  }

  const pedidosCompraPendentes =
    pedidosRascunho.totalCount + pedidosEnviado.totalCount + pedidosParcial.totalCount;
  const producoesNaoConcluidasNaSemana = producoesSemana.filter(
    (producao) => producao.status === "planejada" || producao.status === "em_producao",
  ).length;

  return (
    <Section className="py-8">
      <Container className="flex flex-col gap-6">
        <div>
          <Heading level={2}>Painel Nunca no Vermelho</Heading>
          <Text tone="muted">
            Visão consolidada da saúde financeira — custos, margens, ponto de
            equilíbrio e alertas dos outros módulos.
          </Text>
        </div>

        <ModuleSubNav links={FINANCEIRO_SUB_NAV_LINKS} />

        <PainelSemaforo
          nivel={nivelSemaforo}
          margemMediaPercentual={margemContribuicaoMediaPercentual}
          margemNecessariaPercentual={margemNecessariaPercentual}
        />

        <PainelResumoCards
          custosFixosTotais={custosFixosTotais}
          pontoEquilibrioReceita={pontoEquilibrioReceita}
          metaReceita={meta?.valor_meta_receita ?? null}
          valorEmEstoque={resumoEstoque.valorTotalEmEstoque}
        />

        <PainelAlertas
          fichasNoVermelho={fichasNoVermelho}
          fichasAbaixoDoNecessario={fichasAbaixoDoNecessario}
          ingredientesAbaixoDoMinimo={resumoEstoque.ingredientesAbaixoDoMinimo}
          lotesVencendoEm7Dias={resumoEstoque.lotesVencendoEm7Dias}
          pedidosCompraPendentes={pedidosCompraPendentes}
          producoesNaoConcluidasNaSemana={producoesNaoConcluidasNaSemana}
        />
      </Container>
    </Section>
  );
}
