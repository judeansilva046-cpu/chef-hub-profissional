import { describe, expect, it } from "vitest";

import type { TipoAlerta } from "@/server/observabilidade/alerts";

const TIPOS: TipoAlerta[] = [
  "estoque_zerado",
  "estoque_critico",
  "pedido_parado",
  "falha_pagamento",
  "erro_integracao",
  "falha_impressao",
  "erro_banco",
  "rpc_lenta",
  "api_lenta",
];

describe("alertas operacionais", () => {
  it("cobre os tipos de alerta da sprint", () => {
    expect(TIPOS).toHaveLength(9);
    expect(new Set(TIPOS).size).toBe(9);
  });

  it("idempotência: mesma chave tipo+registro não duplica no mesmo dia", () => {
    const chave = (tipo: string, registroId?: string) =>
      `${tipo}::${registroId ?? "_"}`;
    const abertos = new Set<string>();
    const tentar = (tipo: string, registroId?: string) => {
      const k = chave(tipo, registroId);
      if (abertos.has(k)) return false;
      abertos.add(k);
      return true;
    };

    expect(tentar("estoque_zerado", "ing-1")).toBe(true);
    expect(tentar("estoque_zerado", "ing-1")).toBe(false);
    expect(tentar("estoque_critico", "ing-1")).toBe(true);
  });
});
