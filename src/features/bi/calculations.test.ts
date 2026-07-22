import { describe, expect, it } from "vitest";

import {
  agregarDrillDown,
  calcularLtv,
  cmvPercentual,
  ebitdaSimplificado,
  margemPercentual,
  montarComparativo,
  montarProgressoMetas,
  progressoMeta,
  taxaRetencao,
  ticketMedio,
} from "./calculations";
import { deltaPercentual, resolverComparativo } from "./periods";

describe("BI calculations", () => {
  it("calcula ticket, margem, CMV e LTV", () => {
    expect(ticketMedio(1000, 10)).toBe(100);
    expect(margemPercentual(250, 1000)).toBe(25);
    expect(cmvPercentual(300, 1000)).toBe(30);
    expect(calcularLtv({ ticketMedio: 80, frequenciaMensal: 2, horizonteMeses: 12 })).toBe(
      1920,
    );
    expect(taxaRetencao(4, 10)).toBe(40);
  });

  it("EBITDA só aplica depreciação quando informada", () => {
    expect(ebitdaSimplificado(100).aplicavel).toBe(false);
    expect(ebitdaSimplificado(100, 20)).toEqual({ valor: 120, aplicavel: true });
  });

  it("progresso de meta (normal e invertida)", () => {
    expect(progressoMeta({ valorMeta: 1000, valorAtual: 500 })).toBe(50);
    expect(progressoMeta({ valorMeta: 100, valorAtual: 80, invertida: true })).toBe(100);
    expect(progressoMeta({ valorMeta: 100, valorAtual: 150, invertida: true })).toBe(50);
  });

  it("montarProgressoMetas agrega realizados", () => {
    const rows = montarProgressoMetas(
      [
        {
          id: "1",
          tipo: "faturamento",
          valor_meta: 1000,
          periodo_inicio: "2026-07-01",
          periodo_fim: "2026-07-31",
          unidade: "BRL",
          observacao: null,
        },
      ],
      { faturamento: 800 },
    );
    expect(rows[0]!.progressoPct).toBe(80);
  });

  it("comparativos e delta %", () => {
    expect(deltaPercentual(110, 100)).toBe(10);
    expect(deltaPercentual(0, 0)).toBe(0);
    const items = montarComparativo([
      { label: "Receita", atual: 200, anterior: 100, format: "currency" },
    ]);
    expect(items[0]!.deltaPct).toBe(100);
  });

  it("drill-down empresa → unidade → produto", () => {
    const vendas = [
      {
        ficha_tecnica_id: "p1",
        produtoNome: "Burger",
        categoriaId: "cat1",
        categoriaNome: "Lanches",
        canal_venda_id: "c1",
        canalNome: "iFood",
        valor_total: 50,
        margem_total: 20,
        quantidade: 1,
      },
      {
        ficha_tecnica_id: "p2",
        produtoNome: "Suco",
        categoriaId: "cat2",
        categoriaNome: "Bebidas",
        canal_venda_id: "c1",
        canalNome: "iFood",
        valor_total: 15,
        margem_total: 8,
        quantidade: 1,
      },
    ];
    const unidades = agregarDrillDown(vendas, "unidade");
    expect(unidades).toHaveLength(1);
    expect(unidades[0]!.receita).toBe(65);
    const produtos = agregarDrillDown(vendas, "produto", { unidadeId: "c1" });
    expect(produtos.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
  });

  it("resolverComparativo cobre modos", () => {
    const ref = new Date("2026-07-15T12:00:00");
    expect(resolverComparativo("hoje_ontem", ref).label).toBe("Hoje × Ontem");
    expect(resolverComparativo("semana_semana", ref).label).toBe("Semana × Semana");
    expect(resolverComparativo("mes_mes", ref).atual.inicio).toBe("2026-07-01");
    expect(resolverComparativo("ano_ano", ref).anterior.inicio).toBe("2025-01-01");
  });
});
