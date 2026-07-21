import { describe, expect, it } from "vitest";

import { detectarIntencao, responderIaCompras } from "./ia";

const ctx = {
  previsoes: [
    {
      ingredienteId: "1",
      nome: "Queijo",
      estoqueAtual: 0,
      estoqueMinimo: 5,
      consumoDiario: 1,
      horizonteDias: 7,
      quantidadeSugerida: 12,
      comprarAte: "2026-07-22",
      diasCobertura: 0,
      fatorSazonalidade: 1,
      fornecedorNome: "Laticínios X",
      prioridade: "critica" as const,
      motivo: "zerado",
    },
  ],
  giros: [
    {
      ingredienteId: "1",
      nome: "Queijo",
      consumoPeriodo: 30,
      estoqueMedio: 5,
      giroMensal: 6,
      giroSemanal: 1.4,
      diasCobertura: 5,
      velocidadeDiaria: 1,
    },
    {
      ingredienteId: "2",
      nome: "Farinha velha",
      consumoPeriodo: 0,
      estoqueMedio: 20,
      giroMensal: 0,
      giroSemanal: 0,
      diasCobertura: null,
      velocidadeDiaria: 0,
    },
  ],
  consumos: [
    {
      ingredienteId: "1",
      nome: "Queijo",
      diario: 1,
      semanal: 7,
      mensal: 30,
    },
  ],
  alertas: [],
  abc: [],
  perdasPorProduto: [{ nome: "Alface", quantidade: 3, custo: 15 }],
  valorParado: 200,
  fornecedoresBaratos: [
    { ingredienteNome: "Queijo", fornecedorNome: "Laticínios X", preco: 28 },
  ],
};

describe("IA de compras", () => {
  it("detecta intenções", () => {
    expect(detectarIntencao("O que preciso comprar amanhã?")).toBe("comprar_amanha");
    expect(detectarIntencao("Qual fornecedor está mais barato?")).toBe("fornecedor_barato");
    expect(detectarIntencao("Quanto vou consumir na próxima semana?")).toBe("consumo_semana");
    expect(detectarIntencao("Qual produto está parado?")).toBe("produto_parado");
    expect(detectarIntencao("Qual produto gira mais?")).toBe("produto_gira");
    expect(detectarIntencao("Quanto dinheiro está parado em estoque?")).toBe("dinheiro_parado");
    expect(detectarIntencao("Qual produto mais gera desperdício?")).toBe("desperdicio");
  });

  it("responde com contexto", () => {
    expect(responderIaCompras("O que preciso comprar amanhã?", ctx).resposta).toContain("Queijo");
    expect(responderIaCompras("Qual produto está parado?", ctx).resposta).toContain("Farinha");
    expect(responderIaCompras("Quanto dinheiro está parado em estoque?", ctx).resposta).toMatch(/200/);
    expect(responderIaCompras("olá", ctx).intencao).toBe("desconhecida");
  });
});
