/**
 * Fórmulas do Dashboard Executivo. Não recalcula CMV/margem do zero — só
 * aplica, linha a linha, calcularMargemContribuicaoReal (mesma função do
 * módulo Financeiro, ver src/features/financeiro/calculations.ts) sobre
 * cada venda registrada, combinando custos variáveis gerais + a taxa do
 * canal daquela venda (quando houver). Nenhuma fórmula nova é inventada
 * aqui — só agregação (soma/agrupamento) do que o Financeiro já calcula.
 */
import {
  calcularMargemContribuicaoReal,
  canalParaCustoVariavelAgregado,
  combinarCustosVariaveis,
  type CustoVariavelAgregado,
} from "@/features/financeiro/calculations";
import type { VendaAgregavel } from "@/features/vendas/queries";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Soma o valor de meta de todo mes_referencia que cai dentro de [dataInicio,
 * dataFim] (comparando só o mês) — o "faturamento projetado" do período.
 * Recebe a lista completa de metas_vendas já buscada (listarMetasVendas),
 * não faz query própria.
 */
export function somarMetasNoPeriodo(
  metas: Array<{ mes_referencia: string; valor_meta_receita: number }>,
  dataInicio: string,
  dataFim: string,
): number | null {
  const mesInicio = dataInicio.slice(0, 7);
  const mesFim = dataFim.slice(0, 7);

  const metasNoPeriodo = metas.filter((meta) => {
    const mes = meta.mes_referencia.slice(0, 7);
    return mes >= mesInicio && mes <= mesFim;
  });

  if (metasNoPeriodo.length === 0) return null;
  return metasNoPeriodo.reduce((total, meta) => total + meta.valor_meta_receita, 0);
}

export interface ResumoVendasRealizado {
  faturamentoRealizado: number;
  cmvRealizado: number;
  cmvPercentual: number | null;
  margemRealizada: number;
  margemPercentual: number | null;
  quantidadeTotal: number;
}

export interface RentabilidadeProduto {
  fichaTecnicaId: string;
  quantidadeVendida: number;
  faturamento: number;
  custoTotal: number;
  margem: number;
}

export interface ComparativoCanal {
  canalVendaId: string | null;
  quantidadeVendida: number;
  faturamento: number;
  custoTotal: number;
  margem: number;
}

export interface AnaliseVendas {
  resumo: ResumoVendasRealizado;
  porProduto: RentabilidadeProduto[];
  porCanal: ComparativoCanal[];
}

type CanalTaxa = Pick<Tables<"canais_venda">, "taxa_percentual" | "taxa_fixa">;

/** Uma única passada pelas vendas do período — evita recalcular a margem de cada linha mais de uma vez para resumo/por-produto/por-canal. */
export function analisarVendas(
  vendas: VendaAgregavel[],
  custosVariaveisGerais: CustoVariavelAgregado,
  canaisPorId: Map<string, CanalTaxa>,
): AnaliseVendas {
  let faturamentoRealizado = 0;
  let cmvRealizado = 0;
  let margemRealizada = 0;
  let quantidadeTotal = 0;

  const porProduto = new Map<string, RentabilidadeProduto>();
  const porCanal = new Map<string | null, ComparativoCanal>();

  for (const venda of vendas) {
    const canal = venda.canal_venda_id ? canaisPorId.get(venda.canal_venda_id) : undefined;
    const custosCombinados = canal
      ? combinarCustosVariaveis(custosVariaveisGerais, canalParaCustoVariavelAgregado(canal))
      : custosVariaveisGerais;

    const precoUnitario = venda.quantidade > 0 ? venda.valor_total / venda.quantidade : 0;
    const margemLinha = calcularMargemContribuicaoReal(
      venda.custo_unitario_snapshot,
      precoUnitario,
      custosCombinados,
    );
    const margemTotalLinha = margemLinha ? margemLinha.margemUnitaria * venda.quantidade : 0;

    faturamentoRealizado += venda.valor_total;
    cmvRealizado += venda.custo_unitario_snapshot * venda.quantidade;
    margemRealizada += margemTotalLinha;
    quantidadeTotal += venda.quantidade;

    const custoLinha = venda.custo_unitario_snapshot * venda.quantidade;

    const produtoAtual = porProduto.get(venda.ficha_tecnica_id) ?? {
      fichaTecnicaId: venda.ficha_tecnica_id,
      quantidadeVendida: 0,
      faturamento: 0,
      custoTotal: 0,
      margem: 0,
    };
    produtoAtual.quantidadeVendida += venda.quantidade;
    produtoAtual.faturamento += venda.valor_total;
    produtoAtual.custoTotal += custoLinha;
    produtoAtual.margem += margemTotalLinha;
    porProduto.set(venda.ficha_tecnica_id, produtoAtual);

    const canalAtual = porCanal.get(venda.canal_venda_id) ?? {
      canalVendaId: venda.canal_venda_id,
      quantidadeVendida: 0,
      faturamento: 0,
      custoTotal: 0,
      margem: 0,
    };
    canalAtual.quantidadeVendida += venda.quantidade;
    canalAtual.faturamento += venda.valor_total;
    canalAtual.custoTotal += custoLinha;
    canalAtual.margem += margemTotalLinha;
    porCanal.set(venda.canal_venda_id, canalAtual);
  }

  return {
    resumo: {
      faturamentoRealizado,
      cmvRealizado,
      cmvPercentual: faturamentoRealizado > 0 ? (cmvRealizado / faturamentoRealizado) * 100 : null,
      margemRealizada,
      margemPercentual:
        faturamentoRealizado > 0 ? (margemRealizada / faturamentoRealizado) * 100 : null,
      quantidadeTotal,
    },
    porProduto: Array.from(porProduto.values()).sort((a, b) => b.margem - a.margem),
    porCanal: Array.from(porCanal.values()).sort((a, b) => b.faturamento - a.faturamento),
  };
}
