import { describe, expect, it } from "vitest";

import {
  calcularTemposMedios,
  formatarDuracao,
  segundosEntre,
  tempoItemSegundos,
  tempoPedidoSegundos,
} from "./metrics";

describe("metrics KDS", () => {
  it("formata duração e calcula intervalos", () => {
    expect(formatarDuracao(null)).toBe("—");
    expect(formatarDuracao(65)).toBe("1:05");
    expect(formatarDuracao(3661)).toBe("1h 01m");
    expect(
      segundosEntre("2026-07-21T12:00:00.000Z", "2026-07-21T12:01:30.000Z"),
    ).toBe(90);
  });

  it("cronômetros de pedido e item", () => {
    const agora = Date.parse("2026-07-21T12:10:00.000Z");
    expect(
      tempoPedidoSegundos(
        { confirmado_em: "2026-07-21T12:00:00.000Z", criado_em: "2026-07-21T11:59:00.000Z" },
        agora,
      ),
    ).toBe(600);
    expect(
      tempoItemSegundos(
        {
          preparo_iniciado_em: "2026-07-21T12:05:00.000Z",
          pronto_em: null,
        },
        agora,
      ),
    ).toBe(300);
  });

  it("calcula tempos médios", () => {
    const medias = calcularTemposMedios([
      {
        confirmado_em: "2026-07-21T12:00:00.000Z",
        criado_em: "2026-07-21T12:00:00.000Z",
        pedido_itens: [
          {
            preparo_iniciado_em: "2026-07-21T12:00:00.000Z",
            pronto_em: "2026-07-21T12:05:00.000Z",
          },
          {
            preparo_iniciado_em: "2026-07-21T12:00:00.000Z",
            pronto_em: "2026-07-21T12:07:00.000Z",
          },
        ],
      },
    ]);
    expect(medias.itensAmostrados).toBe(2);
    expect(medias.tempoMedioItemSegundos).toBe(360);
    expect(medias.tempoMedioPedidoSegundos).toBe(420);
  });
});
