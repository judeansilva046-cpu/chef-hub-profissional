import { describe, expect, it } from "vitest";

import {
  agregarFluxoCaixa,
  calcularDre,
  calcularTotalComEncargos,
  detectarAlertasFinanceiros,
  projetarSaldo,
  saldoDiario,
  statusTitulo,
} from "./calculations";

describe("ERP financeiro calculations", () => {
  it("calcula DRE com lucro e margens", () => {
    const dre = calcularDre({
      receitaBruta: 100000,
      impostos: 5000,
      cmv: 30000,
      despesasOperacionais: 10000,
      folha: 15000,
      marketing: 5000,
      aluguel: 8000,
    });
    expect(dre.receitaLiquida).toBe(95000);
    expect(dre.lucroBruto).toBe(65000);
    expect(dre.ebitda).toBe(27000);
    expect(dre.lucroLiquido).toBe(27000);
    expect(dre.margemLiquidaPct).toBeGreaterThan(0);
  });

  it("agrega fluxo e saldo diário", () => {
    const entries = [
      { flow_date: "2026-07-01", tipo: "entrada", amount: 100 },
      { flow_date: "2026-07-01", tipo: "saida", amount: 40 },
      { flow_date: "2026-07-02", tipo: "entrada", amount: 50 },
    ];
    expect(agregarFluxoCaixa(entries)).toEqual({
      entradas: 150,
      saidas: 40,
      saldo: 110,
    });
    const diario = saldoDiario(entries, 10);
    expect(diario[0]!.saldo).toBe(70);
    expect(diario[1]!.saldo).toBe(120);
  });

  it("status de título e encargos", () => {
    expect(statusTitulo("2026-07-01", 100, 100, "2026-07-10")).toBe("paid");
    expect(statusTitulo("2026-07-01", 100, 20, "2026-07-10")).toBe("overdue");
    expect(statusTitulo("2026-07-20", 100, 0, "2026-07-10")).toBe("open");
    expect(calcularTotalComEncargos(100, 5, 2)).toBe(107);
  });

  it("projeta saldo e detecta alertas", () => {
    expect(projetarSaldo(100, 50, 80)).toBe(70);
    const alertas = detectarAlertasFinanceiros({
      apVencendo: 2,
      apVencidas: 1,
      saldoFluxo: -10,
      cmvPct: 45,
      margemPct: 15,
      saldoCaixa: -5,
    });
    expect(alertas.map((a) => a.tipo)).toEqual(
      expect.arrayContaining([
        "conta_vencendo",
        "conta_vencida",
        "fluxo_negativo",
        "cmv_alto",
        "margem_baixa",
        "caixa_negativo",
      ]),
    );
  });
});
