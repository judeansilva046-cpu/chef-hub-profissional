import { describe, expect, it } from "vitest";

describe("métricas observabilidade", () => {
  it("calcula ticket médio e margem", () => {
    const entregues = [{ total: 40 }, { total: 60 }];
    const ticketMedio =
      entregues.reduce((a, p) => a + p.total, 0) / entregues.length;
    expect(ticketMedio).toBe(50);

    const receita = 1000;
    const margemTotal = 350;
    const cmv = receita - margemTotal;
    const margemPct = Math.round((margemTotal / receita) * 1000) / 10;
    expect(cmv).toBe(650);
    expect(margemPct).toBe(35);
  });

  it("agrega erros por módulo", () => {
    const logs = [
      { nivel: "ERROR", modulo: "pedidos" },
      { nivel: "CRITICAL", modulo: "pedidos" },
      { nivel: "ERROR", modulo: "pagamentos" },
    ];
    const errosPorModulo: Record<string, number> = {};
    for (const row of logs) {
      errosPorModulo[row.modulo] = (errosPorModulo[row.modulo] ?? 0) + 1;
    }
    expect(errosPorModulo.pedidos).toBe(2);
    expect(errosPorModulo.pagamentos).toBe(1);
  });
});
