import { describe, expect, it } from "vitest";

import { obterProvider, resolverProvider } from "./registry";
import {
  IntegrationNotAvailableError,
  PROVIDER_CATALOG,
  catalogByCategory,
} from "./types";

describe("registry de integrações", () => {
  it("registra todos os providers do catálogo", () => {
    for (const item of PROVIDER_CATALOG) {
      const provider = obterProvider(item.id);
      expect(provider.id).toBe(item.id);
      expect(provider.category).toBe(item.category);
    }
  });

  it("agrupa por categoria", () => {
    expect(catalogByCategory("delivery").length).toBeGreaterThanOrEqual(5);
    expect(catalogByCategory("whatsapp")).toHaveLength(2);
    expect(catalogByCategory("pix")).toHaveLength(5);
    expect(catalogByCategory("printer")).toHaveLength(4);
    expect(catalogByCategory("cardapio_digital")).toHaveLength(1);
  });

  it("stubs não chamam produção — testarConexao lança", async () => {
    const ifood = obterProvider("ifood");
    await expect(
      ifood.testarConexao({
        empresaId: "e1",
        integrationId: "i1",
        credentials: {},
        config: {},
      }),
    ).rejects.toBeInstanceOf(IntegrationNotAvailableError);
  });

  it("resolverProvider rejeita id inválido", () => {
    expect(resolverProvider("nao_existe")).toBeNull();
    expect(resolverProvider("mercado_pago")?.id).toBe("mercado_pago");
  });
});
