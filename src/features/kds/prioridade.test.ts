import { describe, expect, it } from "vitest";

import { calcularScorePrioridade, priorizarFilaKds } from "./prioridade";

describe("prioridade KDS", () => {
  const agora = Date.parse("2026-07-21T12:00:00.000Z");

  it("prioriza pedidos mais antigos e entrega", () => {
    const antigo = calcularScorePrioridade(
      {
        id: "1",
        tipo: "balcao",
        status: "confirmado",
        referenciaEm: "2026-07-21T11:40:00.000Z",
        itensPendentes: 2,
      },
      agora,
    );
    const entrega = calcularScorePrioridade(
      {
        id: "2",
        tipo: "entrega",
        status: "confirmado",
        referenciaEm: "2026-07-21T11:50:00.000Z",
        itensPendentes: 1,
      },
      agora,
      { prioridadeEntregaBoost: 10 },
    );

    expect(antigo.minutosEspera).toBe(20);
    expect(antigo.atrasado).toBe(true);
    expect(antigo.scorePrioridade).toBeGreaterThan(entrega.scorePrioridade);
  });

  it("ordena a fila por score desc", () => {
    const fila = priorizarFilaKds(
      [
        {
          id: "a",
          tipo: "balcao",
          status: "em_preparo",
          referenciaEm: "2026-07-21T11:55:00.000Z",
          itensPendentes: 1,
        },
        {
          id: "b",
          tipo: "entrega",
          status: "confirmado",
          referenciaEm: "2026-07-21T11:30:00.000Z",
          itensPendentes: 3,
        },
      ],
      agora,
    );

    expect(fila[0]!.id).toBe("b");
    expect(fila[1]!.id).toBe("a");
  });
});
