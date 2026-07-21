import { describe, expect, it } from "vitest";

import { calcularCustoHora, calcularCustoMensal } from "./calculations";

describe("funcionarios/calculations", () => {
  it("calcula encargos e custo total mensal", () => {
    expect(
      calcularCustoMensal({
        salarioBruto: 2000,
        beneficiosMensais: 400,
        percentualEncargos: 36.8,
      }),
    ).toEqual({
      encargos: 736,
      custoTotalMensal: 3136,
    });
  });

  it("calcula custo por hora com média de horas mensais (carga × 52/12)", () => {
    // 44h/semana × 52/12 = 190,666... horas/mês
    // 3136 / (44 * 52 / 12) ≈ 16.4368
    const custoHora = calcularCustoHora(3136, 44);
    expect(custoHora).toBeCloseTo(3136 / ((44 * 52) / 12), 5);
  });

  it("retorna 0 quando a carga horária é inválida", () => {
    expect(calcularCustoHora(3000, 0)).toBe(0);
    expect(calcularCustoHora(3000, -10)).toBe(0);
  });

  it("aceita encargos e benefícios zerados", () => {
    expect(
      calcularCustoMensal({
        salarioBruto: 1500,
        beneficiosMensais: 0,
        percentualEncargos: 0,
      }),
    ).toEqual({
      encargos: 0,
      custoTotalMensal: 1500,
    });
  });
});
