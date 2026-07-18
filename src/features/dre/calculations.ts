/**
 * DRE (Demonstrativo de Resultado). Receita/CMV reaproveitam 100%
 * analisarVendas (src/features/dashboard/calculations.ts, mesma fonte do
 * Dashboard Executivo) — nada de vendas é recalculado aqui. A única peça
 * nova é a despesa operacional, vinda de contas_pagar PAGAS no período
 * (regime de caixa: o que realmente saiu, não o que estava planejado em
 * custos_fixos).
 */
import type { ResumoVendasRealizado } from "@/features/dashboard/calculations";

export interface DespesaPorCategoria {
  categoria: string;
  valor: number;
}

export interface DemonstrativoResultado {
  receitaBruta: number;
  cmv: number;
  lucroBruto: number;
  margemBrutaPercentual: number | null;
  despesasOperacionais: number;
  despesasPorCategoria: DespesaPorCategoria[];
  lucroLiquido: number;
  margemLiquidaPercentual: number | null;
}

const CATEGORIA_LABEL: Record<string, string> = {
  compra: "Compras de insumos",
  despesa_fixa: "Despesas fixas",
  manual: "Outras despesas",
};

export function calcularDRE(
  resumoVendas: ResumoVendasRealizado,
  contasPagasNoPeriodo: Array<{ valor_pago: number | null; valor: number; categoria_origem: string }>,
): DemonstrativoResultado {
  const receitaBruta = resumoVendas.faturamentoRealizado;
  const cmv = resumoVendas.cmvRealizado;
  const lucroBruto = receitaBruta - cmv;
  const margemBrutaPercentual = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : null;

  const porCategoria = new Map<string, number>();
  let despesasOperacionais = 0;
  for (const conta of contasPagasNoPeriodo) {
    const valor = conta.valor_pago ?? conta.valor;
    despesasOperacionais += valor;
    porCategoria.set(conta.categoria_origem, (porCategoria.get(conta.categoria_origem) ?? 0) + valor);
  }

  const despesasPorCategoria = Array.from(porCategoria.entries())
    .map(([categoria, valor]) => ({ categoria: CATEGORIA_LABEL[categoria] ?? categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const lucroLiquido = lucroBruto - despesasOperacionais;
  const margemLiquidaPercentual = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : null;

  return {
    receitaBruta,
    cmv,
    lucroBruto,
    margemBrutaPercentual,
    despesasOperacionais,
    despesasPorCategoria,
    lucroLiquido,
    margemLiquidaPercentual,
  };
}
