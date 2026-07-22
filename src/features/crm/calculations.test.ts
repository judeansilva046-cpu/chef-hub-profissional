import { describe, expect, it } from "vitest";

import {
  aplicarSaldo,
  calcularCashback,
  calcularDashboardCrm,
  calcularDescontoCupom,
  calcularPontosAcumulo,
  calcularValorResgate,
  dataExpiracaoPontos,
  podeResgatarPontos,
  renderTemplate,
  segmentarClientes,
  validarCupom,
} from "./calculations";

describe("CRM — fidelidade e cashback", () => {
  it("acumula e resgata pontos", () => {
    expect(calcularPontosAcumulo(100, 1)).toBe(100);
    expect(calcularValorResgate(100, 0.05)).toBe(5);
    expect(podeResgatarPontos(50, 100, 100).ok).toBe(false);
    expect(podeResgatarPontos(150, 100, 100).ok).toBe(true);
    expect(aplicarSaldo(100, 20, "debito")).toBe(80);
    expect(calcularCashback(200, 5)).toBe(10);
    expect(dataExpiracaoPontos("2026-01-01T00:00:00.000Z", 30)).toContain("2026-01-31");
  });
});

describe("CRM — cupons", () => {
  it("valida percentual e limites", () => {
    const base = {
      tipo: "percentual" as const,
      discountPercent: 10,
      minOrderAmount: 50,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2026-12-31T23:59:59.000Z",
      active: true,
      usesCount: 0,
      maxUses: 10,
      maxUsesPerCustomer: 1,
      customerUses: 0,
    };
    const ok = validarCupom(base, 100, "2026-07-21T12:00:00.000Z");
    expect(ok.ok).toBe(true);
    expect(ok.desconto).toBe(10);

    expect(validarCupom(base, 20, "2026-07-21T12:00:00.000Z").ok).toBe(false);
    expect(
      validarCupom({ ...base, tipo: "primeira_compra", primeiraCompra: false }, 100).ok,
    ).toBe(false);
    expect(calcularDescontoCupom({ ...base, tipo: "valor_fixo", discountAmount: 15 }, 100)).toBe(
      15,
    );
  });
});

describe("CRM — segmentação e dashboard", () => {
  it("segmenta clientes dinamicamente", () => {
    const segs = segmentarClientes([
      {
        clienteId: "1",
        nome: "VIP",
        totalGasto: 1000,
        quantidadeCompras: 8,
        ticketMedio: 125,
        diasDesdeUltimaCompra: 5,
        diasDesdeCadastro: 200,
        ativo: true,
      },
      {
        clienteId: "2",
        nome: "Inativo",
        totalGasto: 40,
        quantidadeCompras: 1,
        ticketMedio: 40,
        diasDesdeUltimaCompra: 60,
        diasDesdeCadastro: 90,
        ativo: true,
      },
    ]);
    expect(segs.vip).toContain("1");
    expect(segs.inativos).toContain("2");
    expect(segs.novos).toContain("2");
  });

  it("monta KPIs e templates", () => {
    const dash = calcularDashboardCrm({
      totalClientes: 100,
      novosClientes: 10,
      ativos: 70,
      inativos: 30,
      ticketMedio: 55,
      frequenciaMedia: 2.5,
      taxaRetorno: 40,
      cuponsUsados: 12,
      pontosEmitidos: 5000,
      pontosResgatados: 1200,
      cashbackConcedido: 300,
    });
    expect(dash.taxaAtivos).toBe(70);
    expect(renderTemplate("Olá {{nome}}!", { nome: "Ana" })).toBe("Olá Ana!");
  });
});
