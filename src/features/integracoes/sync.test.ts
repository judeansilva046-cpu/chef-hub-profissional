import { describe, expect, it } from "vitest";

import { obterProvider } from "@/integrations/registry";

describe("sincronização (homologação)", () => {
  it("sincronizarPedidos retorna pedidos de homologação", async () => {
    const provider = obterProvider("anota_ai");
    const orders = await provider.sincronizarPedidos({
      empresaId: "e",
      integrationId: "i",
      credentials: { clientId: "x", clientSecret: "y" },
      config: {},
    });
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0]!.externalId).toBeTruthy();
  });

  it("atualizarStatusPedido é mockável", async () => {
    const calls: string[] = [];
    const base = obterProvider("goomer");
    const mock = {
      ...base,
      atualizarStatusPedido: async (
        _ctx: Parameters<typeof base.atualizarStatusPedido>[0],
        externalOrderId: string,
        status: string,
      ) => {
        calls.push(`${externalOrderId}:${status}`);
      },
    };
    await mock.atualizarStatusPedido(
      {
        empresaId: "e",
        integrationId: "i",
        credentials: {},
        config: {},
      },
      "ext-1",
      "pronto",
    );
    expect(calls).toEqual(["ext-1:pronto"]);
  });

  it("PIX gera QR em modo homolog", async () => {
    const { mercadoPagoProviderPix } = await import(
      "@/integrations/pix/mercado_pago"
    );
    const qr = await mercadoPagoProviderPix.gerarQrCode(
      {
        empresaId: "e",
        integrationId: "i",
        credentials: {},
        config: {},
      },
      { amount: 10, description: "teste", externalRef: "1" },
    );
    expect(qr.txid).toMatch(/mp_homolog_/);
    expect(qr.qrCode.length).toBeGreaterThan(10);
  });
});
