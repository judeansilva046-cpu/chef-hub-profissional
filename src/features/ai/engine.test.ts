import { describe, expect, it } from "vitest";

import { responderChefHubAi } from "./engine";
import {
  detectarIntencao,
  extrairNomePrato,
  extrairPercentual,
  normalizarPergunta,
} from "./intents";
import type { ChefHubAiContexto } from "./types";

const ctx: ChefHubAiContexto = {
  periodoAtual: {
    inicio: "2026-07-14",
    fim: "2026-07-20",
    label: "Semana",
  },
  periodoAnterior: {
    inicio: "2026-07-07",
    fim: "2026-07-13",
    label: "período anterior",
  },
  financeiro: {
    receitaAtual: 8000,
    receitaAnterior: 10000,
    lucroAtual: 2000,
    lucroAnterior: 3500,
    cmvAtual: 3200,
    cmvAnterior: 2800,
    margemAtualPct: 25,
    margemAnteriorPct: 35,
  },
  produtosLucrativos: [
    {
      id: "1",
      nome: "Burger",
      faturamento: 3000,
      margem: 1200,
      quantidade: 100,
    },
  ],
  perdas: [{ nome: "Alface", quantidade: 5, custo: 40 }],
  comprasUrgentes: [
    {
      nome: "Queijo",
      quantidadeSugerida: 10,
      prioridade: "critica",
      comprarAte: "2026-07-21",
      fornecedorNome: "Laticínios A",
    },
  ],
  fornecedoresPreco: [
    {
      fornecedorNome: "Hortifruti B",
      ingredienteNome: "Tomate",
      precoAtual: 12,
      precoAnterior: 8,
      variacaoPct: 50,
    },
  ],
  garcomSobremesas: [
    { garcomNome: "Ana", quantidade: 12, faturamento: 240 },
    { garcomNome: "Bruno", quantidade: 5, faturamento: 100 },
  ],
  campanhas: [
    {
      nome: "Winback 60d",
      status: "sent",
      channel: "whatsapp",
      enviados: 100,
      convertidos: 18,
      receita: 900,
    },
  ],
  clientesInativos: [
    { nome: "Carlos", dias: 75, totalGasto: 450 },
  ],
  receitaPorCanal: [
    { nome: "iFood", receita: 5000, qtd: 80 },
    { nome: "Salão", receita: 3000, qtd: 40 },
  ],
  fichas: [
    {
      id: "f1",
      nome: "Burger",
      custoPorPorcao: 12,
      preco: 32,
      margemPct: 40,
    },
  ],
  custosVariaveis: { percentualTotal: 10, fixoTotal: 1 },
};

describe("ChefHub AI intents", () => {
  it("normaliza e detecta intenções principais", () => {
    expect(normalizarPergunta("Por quê?")).toBe("por que");
    expect(detectarIntencao("Por que meu lucro caiu esta semana?")).toBe(
      "lucro_caiu",
    );
    expect(
      detectarIntencao("Qual fornecedor aumentou mais os preços?"),
    ).toBe("fornecedor_preco");
    expect(detectarIntencao("Quanto devo comprar amanhã?")).toBe(
      "comprar_amanha",
    );
    expect(
      detectarIntencao("Quais produtos estão gerando desperdício?"),
    ).toBe("desperdicio");
    expect(
      detectarIntencao("Qual garçom vende mais sobremesas?"),
    ).toBe("garcom_sobremesas");
    expect(
      detectarIntencao("Qual campanha trouxe mais clientes?"),
    ).toBe("campanha_clientes");
    expect(
      detectarIntencao(
        'Se eu aumentar o preço deste prato "Burger" em 5%, quanto muda minha margem?',
      ),
    ).toBe("simulacao_preco");
    expect(detectarIntencao("O CMV aumentou por quê?")).toBe("cmv_subiu");
    expect(
      detectarIntencao("Quais clientes não voltam há 60 dias?"),
    ).toBe("clientes_inativos");
  });

  it("extrai percentual e nome do prato", () => {
    expect(extrairPercentual("aumentar em 5%")).toBe(5);
    expect(extrairNomePrato('prato "Burger Special" em 5%')).toBe(
      "Burger Special",
    );
  });
});

describe("ChefHub AI engine", () => {
  it("explica queda de lucro com fatores", () => {
    const r = responderChefHubAi("Por que meu lucro caiu?", ctx);
    expect(r.intencao).toBe("lucro_caiu");
    expect(r.resposta).toMatch(/Lucro|receita|CMV/i);
    expect(r.explicacao.length).toBeGreaterThan(20);
    expect(r.fontes.length).toBeGreaterThan(0);
  });

  it("ranqueia fornecedor com maior alta", () => {
    const r = responderChefHubAi(
      "Qual fornecedor aumentou mais os preços?",
      ctx,
    );
    expect(r.resposta).toContain("Hortifruti B");
    expect(r.resposta).toContain("Tomate");
  });

  it("sugere compras e desperdício", () => {
    expect(
      responderChefHubAi("Quanto devo comprar amanhã?", ctx).resposta,
    ).toContain("Queijo");
    expect(
      responderChefHubAi("Quais produtos geram desperdício?", ctx).resposta,
    ).toContain("Alface");
  });

  it("identifica garçom, campanha e canal", () => {
    expect(
      responderChefHubAi("Qual garçom vende mais sobremesas?", ctx).resposta,
    ).toContain("Ana");
    expect(
      responderChefHubAi("Qual campanha trouxe mais clientes?", ctx).resposta,
    ).toContain("Winback");
    expect(
      responderChefHubAi("Qual canal performou melhor?", ctx).resposta,
    ).toContain("iFood");
  });

  it("simula aumento de preço na margem", () => {
    const r = responderChefHubAi(
      'Se eu aumentar o preço deste prato "Burger" em 5%, quanto muda minha margem?',
      ctx,
    );
    expect(r.intencao).toBe("simulacao_preco");
    expect(r.resposta).toContain("Burger");
    expect(r.resposta).toMatch(/5%/);
    expect(r.dados).toMatchObject({ pct: 5 });
  });

  it("lista inativos e responde desconhecida", () => {
    expect(
      responderChefHubAi("Quais clientes não voltam há 60 dias?", ctx)
        .resposta,
    ).toContain("Carlos");
    expect(responderChefHubAi("olá mundo", ctx).intencao).toBe("desconhecida");
  });
});
