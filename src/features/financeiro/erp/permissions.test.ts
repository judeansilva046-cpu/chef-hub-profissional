import { describe, expect, it } from "vitest";

import { podeAcessarRota } from "@/server/auth/permissoes-rota";

describe("RBAC financeiro ERP", () => {
  it("financeiro/owner/gerente acessam /financeiro/*", () => {
    for (const papel of ["owner", "gerente", "financeiro"] as const) {
      expect(podeAcessarRota(papel, "/financeiro/erp")).toBe(true);
      expect(podeAcessarRota(papel, "/financeiro/contas-pagar")).toBe(true);
      expect(podeAcessarRota(papel, "/financeiro/dre")).toBe(true);
    }
  });

  it("caixa/cozinha não acessam financeiro", () => {
    expect(podeAcessarRota("caixa", "/financeiro/erp")).toBe(false);
    expect(podeAcessarRota("cozinha", "/financeiro/contas-pagar")).toBe(false);
  });
});
