import { describe, expect, it } from "vitest";

import {
  agregarConsumoPorDimensao,
  calcularCmvInteligente,
  calcularConsumoMedio,
  calcularGiro,
  classificarCurvaAbc,
  fatorSazonalidade,
  listarAlertas,
  nivelAlerta,
  preverCompra,
  valorParadoEmEstoque,
} from "./calculations";

describe("estoque inteligente — cálculos", () => {
  it("classifica curva ABC 80/15/5", () => {
    const abc = classificarCurvaAbc([
      { ingredienteId: "1", nome: "A1", valor: 800 },
      { ingredienteId: "2", nome: "B1", valor: 150 },
      { ingredienteId: "3", nome: "C1", valor: 50 },
    ]);
    expect(abc[0]!.classe).toBe("A");
    expect(abc[1]!.classe).toBe("B");
    expect(abc[2]!.classe).toBe("C");
  });

  it("calcula giro, cobertura e velocidade", () => {
    const giro = calcularGiro({
      ingredienteId: "1",
      nome: "Queijo",
      consumoPeriodo: 30,
      diasPeriodo: 30,
      estoqueAtual: 10,
      estoqueMedio: 10,
    });
    expect(giro.velocidadeDiaria).toBe(1);
    expect(giro.giroMensal).toBe(3);
    expect(giro.diasCobertura).toBe(10);
  });

  it("calcula consumo médio diário/semanal/mensal", () => {
    const c = calcularConsumoMedio({
      ingredienteId: "1",
      nome: "Tomate",
      consumoPeriodo: 30,
      diasPeriodo: 30,
      estoqueAtual: 5,
      estoqueMinimo: 2,
      custoMedio: 1,
      categoriaNome: "Hortifruti",
    });
    expect(c.diario).toBe(1);
    expect(c.semanal).toBe(7);
    expect(c.mensal).toBe(30);
  });

  it("agrega consumo por categoria", () => {
    const agg = agregarConsumoPorDimensao(
      [
        {
          ingredienteId: "1",
          nome: "A",
          categoriaId: "c1",
          categoriaNome: "Cat",
          diario: 1,
          semanal: 7,
          mensal: 30,
        },
        {
          ingredienteId: "2",
          nome: "B",
          categoriaId: "c1",
          categoriaNome: "Cat",
          diario: 2,
          semanal: 14,
          mensal: 60,
        },
      ],
      "categoria",
    );
    expect(agg[0]!.mensal).toBe(90);
  });

  it("prevê compra e prioridades de alerta", () => {
    expect(nivelAlerta(0, 10)).toBe("zerado");
    expect(nivelAlerta(1, 10)).toBe("critico");
    expect(nivelAlerta(5, 10)).toBe("baixo");
    expect(nivelAlerta(20, 10)).toBe("ok");

    const prev = preverCompra({
      ingredienteId: "1",
      nome: "Queijo",
      estoqueAtual: 2,
      estoqueMinimo: 10,
      consumoDiario: 1,
      horizonteDias: 7,
      hojeIso: "2026-07-21T00:00:00.000Z",
    });
    expect(prev.quantidadeSugerida).toBeGreaterThan(0);
    expect(prev.prioridade).toBe("critica");
  });

  it("calcula CMV inteligente e valor parado", () => {
    const cmv = calcularCmvInteligente({
      estoqueInicialValor: 1000,
      comprasValor: 500,
      perdasValor: 50,
      estoqueFinalValor: 800,
      vendasValor: 2000,
    });
    expect(cmv.cmv).toBe(700);
    expect(cmv.cmvPercentualSobreVendas).toBe(35);

    expect(
      valorParadoEmEstoque([
        { estoqueAtual: 10, custoMedio: 5, consumoPeriodo: 0, diasPeriodo: 30 },
        { estoqueAtual: 4, custoMedio: 2, consumoPeriodo: 10, diasPeriodo: 30 },
      ]),
    ).toBe(50);

    expect(fatorSazonalidade(14, 30)).toBeGreaterThan(1);
  });

  it("lista alertas ordenados", () => {
    const alertas = listarAlertas([
      {
        ingredienteId: "a",
        nome: "A",
        consumoPeriodo: 0,
        diasPeriodo: 30,
        estoqueAtual: 5,
        estoqueMinimo: 10,
        custoMedio: 1,
      },
      {
        ingredienteId: "b",
        nome: "B",
        consumoPeriodo: 0,
        diasPeriodo: 30,
        estoqueAtual: 0,
        estoqueMinimo: 10,
        custoMedio: 1,
      },
    ]);
    expect(alertas[0]!.nivel).toBe("zerado");
    expect(alertas[1]!.nivel).toBe("baixo");
  });
});
