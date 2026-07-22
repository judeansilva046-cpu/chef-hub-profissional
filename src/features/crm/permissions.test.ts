import { describe, expect, it } from "vitest";

import { podeGerirCrm, podeLerCrm, podeOperarCrm } from "./permissions";

describe("CRM RBAC helpers", () => {
  it("gestão só owner/gerente", () => {
    expect(podeGerirCrm("owner")).toBe(true);
    expect(podeGerirCrm("gerente")).toBe(true);
    expect(podeGerirCrm("caixa")).toBe(false);
    expect(podeGerirCrm("financeiro")).toBe(false);
  });

  it("operação inclui caixa/garçom", () => {
    expect(podeOperarCrm("caixa")).toBe(true);
    expect(podeOperarCrm("garcom")).toBe(true);
    expect(podeOperarCrm("cozinha")).toBe(false);
  });

  it("leitura inclui financeiro", () => {
    expect(podeLerCrm("financeiro")).toBe(true);
    expect(podeLerCrm("cozinha")).toBe(false);
  });
});
