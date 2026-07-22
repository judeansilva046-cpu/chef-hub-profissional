import { describe, expect, it } from "vitest";

import { podeUsarChefHubAi } from "./permissions";

describe("ChefHub AI permissions", () => {
  it("libera owner/gerente/financeiro", () => {
    expect(podeUsarChefHubAi("owner")).toBe(true);
    expect(podeUsarChefHubAi("gerente")).toBe(true);
    expect(podeUsarChefHubAi("financeiro")).toBe(true);
    expect(podeUsarChefHubAi("caixa")).toBe(false);
    expect(podeUsarChefHubAi("cozinha")).toBe(false);
  });
});
