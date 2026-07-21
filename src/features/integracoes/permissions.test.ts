import { describe, expect, it } from "vitest";

import { podeAcessarRota } from "@/server/auth/permissoes-rota";

describe("RBAC Central de Integrações", () => {
  it("somente owner acessa /integracoes", () => {
    expect(podeAcessarRota("owner", "/integracoes")).toBe(true);
    expect(podeAcessarRota("gerente", "/integracoes")).toBe(false);
    expect(podeAcessarRota("financeiro", "/integracoes")).toBe(false);
    expect(podeAcessarRota("caixa", "/integracoes")).toBe(false);
    expect(podeAcessarRota("cozinha", "/integracoes")).toBe(false);
    expect(podeAcessarRota("garcom", "/integracoes")).toBe(false);
  });
});
