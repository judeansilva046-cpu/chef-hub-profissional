import { describe, expect, it } from "vitest";

import { IntegrationNotAvailableError } from "@/integrations/types";
import { obterProvider } from "@/integrations/registry";

describe("sincronização (mock, sem produção)", () => {
  it("sincronizarPedidos do stub falha com erro de homologação", async () => {
    const provider = obterProvider("anota_ai");
    await expect(
      provider.sincronizarPedidos({
        empresaId: "e",
        integrationId: "i",
        credentials: { clientId: "x", clientSecret: "y" },
        config: {},
      }),
    ).rejects.toThrow(/homologação/);
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

  it("PIX gateway stub não gera QR em produção", async () => {
    const { mercadoPagoProviderPix } = await import(
      "@/integrations/pix/mercado_pago"
    );
    await expect(
      mercadoPagoProviderPix.gerarQrCode(
        {
          empresaId: "e",
          integrationId: "i",
          credentials: {},
          config: {},
        },
        { amount: 10, description: "teste", externalRef: "1" },
      ),
    ).rejects.toBeInstanceOf(IntegrationNotAvailableError);
  });
});
