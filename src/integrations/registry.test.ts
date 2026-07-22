import { describe, expect, it } from "vitest";

import { obterProvider, resolverProvider } from "./registry";
import { PROVIDER_CATALOG, catalogByCategory } from "./types";

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

  it("homologação: testarConexao retorna sucesso sem rede", async () => {
    const ifood = obterProvider("ifood");
    const result = await ifood.testarConexao({
      empresaId: "e1",
      integrationId: "i1",
      credentials: {},
      config: {},
    });
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/Homologação OK|iFood/i);
  });

  it("sincroniza produtos/pedidos em homolog", async () => {
    const ifood = obterProvider("ifood");
    const ctx = {
      empresaId: "e1",
      integrationId: "i1",
      credentials: {},
      config: {},
    };
    const products = await ifood.sincronizarProdutos(ctx);
    const orders = await ifood.sincronizarPedidos(ctx);
    expect(products.length).toBeGreaterThan(0);
    expect(orders.length).toBeGreaterThan(0);
  });

  it("resolverProvider rejeita id inválido", () => {
    expect(resolverProvider("nao_existe")).toBeNull();
    expect(resolverProvider("mercado_pago")?.id).toBe("mercado_pago");
  });
});
