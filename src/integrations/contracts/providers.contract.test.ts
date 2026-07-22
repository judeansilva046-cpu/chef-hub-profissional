import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ifoodOAuthAuthorizeUrl } from "../delivery/ifood";
import { cardapioDigitalMenu } from "../cardapio-digital/cardapio_digital";
import { asaasProviderPix } from "../pix/asaas";
import { mercadoPagoProviderPix } from "../pix/mercado_pago";
import { buildEscPosJob } from "../printers/escpos-builder";
import { epsonProviderPrinter } from "../printers/epson";
import { elginProviderPrinter } from "../printers/elgin";
import { bematechProviderPrinter } from "../printers/bematech";
import { escposProviderPrinter } from "../printers/escpos";
import { obterProvider } from "../registry";
import {
  CircuitOpenError,
  getCircuitState,
  resetCircuitBreakers,
  withCircuitBreaker,
} from "../resilience";
import { PROVIDER_CATALOG } from "../types";
import { evolutionApiProviderWhatsApp } from "../whatsapp/evolution_api";
import { whatsappCloudProviderWhatsApp } from "../whatsapp/whatsapp_cloud";

const ctx = {
  empresaId: "empresa-homolog",
  integrationId: "int-1",
  credentials: {} as Record<string, string>,
  config: {},
};

describe("contrato — providers homologáveis", () => {
  const prevMode = process.env.INTEGRACOES_MODE;

  beforeEach(() => {
    process.env.INTEGRACOES_MODE = "homolog";
    resetCircuitBreakers();
  });

  afterEach(() => {
    if (prevMode === undefined) delete process.env.INTEGRACOES_MODE;
    else process.env.INTEGRACOES_MODE = prevMode;
  });

  it("todo provider do catálogo implementa o contrato base", async () => {
    for (const item of PROVIDER_CATALOG) {
      const p = obterProvider(item.id);
      expect(p.id).toBe(item.id);
      expect(p.category).toBe(item.category);
      const test = await p.testarConexao(ctx);
      expect(test.success).toBe(true);
      expect(typeof p.validarAssinaturaWebhook({}, new Headers())).toBe("boolean");
    }
  });

  it("iFood — OAuth URL + sync produtos/pedidos/status", async () => {
    const url = ifoodOAuthAuthorizeUrl({
      clientId: "cid",
      redirectUri: "http://localhost/callback",
    });
    expect(url).toContain("oauth/authorize");
    expect(url).toContain("client_id=cid");

    const ifood = obterProvider("ifood");
    const products = await ifood.sincronizarProdutos(ctx);
    const orders = await ifood.sincronizarPedidos(ctx);
    expect(products.every((p) => p.externalId && p.name)).toBe(true);
    expect(orders.every((o) => o.externalId && o.status)).toBe(true);
    await expect(
      ifood.atualizarStatusPedido(ctx, orders[0]!.externalId, "confirmado"),
    ).resolves.toBeUndefined();
  });

  it("WhatsApp — confirmação / pronto / saiu para entrega / campanha", async () => {
    for (const cap of [whatsappCloudProviderWhatsApp, evolutionApiProviderWhatsApp]) {
      const conf = await cap.enviarMensagem(ctx, "5511999999999", "Pedido confirmado");
      expect(conf.messageId).toBeTruthy();
      await cap.notificarStatusPedido(ctx, "5511999999999", "pronto");
      await cap.notificarStatusPedido(ctx, "5511999999999", "saiu_para_entrega");
      const tpl = await cap.enviarTemplate(ctx, "5511999999999", "crm_campaign", {
        nome: "Ana",
      });
      expect(tpl.messageId).toBeTruthy();
    }
  });

  it("PIX — QR, consulta, conciliação e estorno (homolog)", async () => {
    for (const pix of [mercadoPagoProviderPix, asaasProviderPix]) {
      const qr = await pix.gerarQrCode(ctx, {
        amount: 25.5,
        description: "Mesa 3",
        externalRef: "ref-1",
      });
      expect(qr.qrCode.length).toBeGreaterThan(5);
      expect(qr.txid).toBeTruthy();
      const status = await pix.consultarPagamento(ctx, qr.txid);
      expect(status.status).toBeTruthy();
      const conc = await pix.conciliar(ctx, "2026-01-01", "2026-12-31");
      expect(conc.matched).toBeGreaterThanOrEqual(0);
      await expect(pix.cancelar(ctx, qr.txid)).resolves.toBeUndefined();
    }
  });

  it("impressoras — cozinha/bar/balcão/caixa ESC/POS", async () => {
    const setores = ["cozinha", "bar", "balcao", "caixa"] as const;
    const drivers = [
      epsonProviderPrinter,
      elginProviderPrinter,
      bematechProviderPrinter,
      escposProviderPrinter,
    ];
    for (const type of setores) {
      const built = buildEscPosJob({ type, payload: `Item ${type}` });
      expect(built.bytesBase64.length).toBeGreaterThan(0);
      expect(built.raw).toContain(type.toUpperCase());
      for (const d of drivers) {
        const job = await d.imprimir(ctx, { type, payload: `Pedido ${type}` });
        expect(job.jobId).toMatch(/^print_/);
      }
    }
  });

  it("cardápio digital — QR mesa + autoatendimento", async () => {
    const qr = await cardapioDigitalMenu.gerarQrCodeMesa(ctx, "mesa-12");
    expect(qr.url).toContain("/cardapio/");
    expect(qr.url).toContain("mesa-12");
    const order = await cardapioDigitalMenu.receberPedidoAutoatendimento(ctx, {
      mesaId: "mesa-12",
      items: [{ name: "Burger", qty: 1 }],
    });
    expect(order.orderId).toMatch(/^menu_/);
  });

  it("falha + reconexão do circuit breaker", async () => {
    const key = "reconnect-test";
    for (let i = 0; i < 3; i++) {
      await expect(
        withCircuitBreaker(
          key,
          async () => {
            throw new Error("down");
          },
          { failureThreshold: 3, cooldownMs: 20 },
        ),
      ).rejects.toThrow("down");
    }
    expect(getCircuitState(key)).toBe("open");
    await expect(
      withCircuitBreaker(key, async () => "x", {
        failureThreshold: 3,
        cooldownMs: 20,
      }),
    ).rejects.toBeInstanceOf(CircuitOpenError);

    await new Promise((r) => setTimeout(r, 25));
    const ok = await withCircuitBreaker(key, async () => "back", {
      failureThreshold: 3,
      cooldownMs: 20,
      successThreshold: 1,
    });
    expect(ok).toBe("back");
    expect(getCircuitState(key)).toBe("closed");
  });

  it("modo disabled bloqueia operações", async () => {
    process.env.INTEGRACOES_MODE = "disabled";
    const ifood = obterProvider("ifood");
    await expect(ifood.sincronizarProdutos(ctx)).rejects.toThrow(/disabled/i);
  });
});
