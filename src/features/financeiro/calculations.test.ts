import { describe, expect, it } from "vitest";

import {
  calcularMargemContribuicaoReal,
  canalParaCustoVariavelAgregado,
} from "./calculations";

describe("financeiro/calculations", () => {
  it("converte canal em custo variável agregado", () => {
    expect(canalParaCustoVariavelAgregado({ taxa_percentual: 12, taxa_fixa: 1.5 })).toEqual({
      percentualTotal: 12,
      fixoTotal: 1.5,
    });
  });

  it("calcula margem real com custos variáveis", () => {
    const margem = calcularMargemContribuicaoReal(5, 20, {
      percentualTotal: 10,
      fixoTotal: 1,
    });

    expect(margem).toEqual({
      custoVariavelValor: 3,
      margemUnitaria: 12,
      margemPercentual: 60,
    });
  });

  it("retorna null sem preço", () => {
    expect(calcularMargemContribuicaoReal(5, null, { percentualTotal: 0, fixoTotal: 0 })).toBeNull();
  });
});
