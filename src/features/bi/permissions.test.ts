import { describe, expect, it } from "vitest";

import {
  dashboardsDoPapel,
  papelPodeVerDashboard,
  podeGerirMetasBi,
  podeLerBi,
} from "./permissions";

describe("BI permissions", () => {
  it("owner/gerente/financeiro leem BI", () => {
    expect(podeLerBi("owner")).toBe(true);
    expect(podeLerBi("gerente")).toBe(true);
    expect(podeLerBi("financeiro")).toBe(true);
    expect(podeLerBi("caixa")).toBe(false);
    expect(podeLerBi("cozinha")).toBe(false);
  });

  it("financeiro não vê KDS/funcionários/salão", () => {
    expect(papelPodeVerDashboard("financeiro", "financeiro")).toBe(true);
    expect(papelPodeVerDashboard("financeiro", "kds")).toBe(false);
    expect(papelPodeVerDashboard("financeiro", "funcionarios")).toBe(false);
    expect(papelPodeVerDashboard("financeiro", "salao")).toBe(false);
    expect(papelPodeVerDashboard("gerente", "kds")).toBe(true);
  });

  it("metas gerenciáveis por papéis de BI", () => {
    expect(podeGerirMetasBi("financeiro")).toBe(true);
    expect(podeGerirMetasBi("garcom")).toBe(false);
    expect(dashboardsDoPapel("owner")).toContain("metas");
  });
});
