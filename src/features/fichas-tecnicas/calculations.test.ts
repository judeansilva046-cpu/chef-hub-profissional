import { describe, expect, it } from "vitest";

import {
  calcularCustoTotalItem,
  calcularPesoLiquidoItem,
  calcularResumoFichaTecnica,
} from "./calculations";

describe("fichas-tecnicas/calculations", () => {
  it("calcula peso líquido com perda", () => {
    expect(
      calcularPesoLiquidoItem({ pesoBruto: 100, percentualPerda: 10, custoUnitario: 1 }),
    ).toBe(90);
  });

  it("custo usa peso bruto", () => {
    expect(
      calcularCustoTotalItem({ pesoBruto: 2, percentualPerda: 50, custoUnitario: 10 }),
    ).toBe(20);
  });

  it("resume ficha com margem alvo", () => {
    const resumo = calcularResumoFichaTecnica({
      itens: [{ pesoBruto: 1, percentualPerda: 0, custoUnitario: 10 }],
      rendimentoQuantidade: 2,
      precoVendaPraticado: 20,
      margemContribuicaoPercentualAlvo: 50,
      margemContribuicaoPadraoEmpresa: null,
    });

    expect(resumo.custoTotal).toBe(10);
    expect(resumo.custoPorPorcao).toBe(5);
    expect(resumo.precoSugerido).toBe(10);
    expect(resumo.cmvPercentual).toBe(25);
    expect(resumo.margemContribuicaoPercentual).toBe(75);
  });
});
