import { createHomologProvider } from "../homolog/create-homolog-provider";
import { fetchJson } from "../http-client";
import { getIntegracoesMode, requireCredentials } from "../mode";
import { callExternal } from "../resilience";
import type { IntegrationProvider, PixGateway } from "../types";
import { IntegrationNotAvailableError } from "../types";

const KEYS = ["access_token"];

export const mercadoPagoProviderPix: PixGateway = {
  async gerarQrCode(ctx, input) {
    if (getIntegracoesMode() === "homolog") {
      const txid = `mp_homolog_${Date.now()}`;
      return {
        qrCode: `00020126580014BR.GOV.BCB.PIX0136${txid}520400005303986540${input.amount.toFixed(2)}5802BR5913ChefHub Homolog6009SAO PAULO62070503***6304ABCD`,
        txid,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    }
    if (!requireCredentials(ctx, KEYS)) {
      throw new IntegrationNotAvailableError("mercado_pago", "Gerar QR Code PIX");
    }
    const data = await callExternal("mercado_pago:pix", () =>
      fetchJson<{
        id: string;
        point_of_interaction?: { transaction_data?: { qr_code?: string } };
        date_of_expiration?: string;
      }>("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.credentials.access_token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": input.externalRef,
        },
        body: JSON.stringify({
          transaction_amount: input.amount,
          description: input.description,
          payment_method_id: "pix",
          external_reference: input.externalRef,
          payer: { email: ctx.credentials.payer_email || "cliente@chefhub.local" },
        }),
      }),
    );
    return {
      qrCode: data.point_of_interaction?.transaction_data?.qr_code ?? "",
      txid: String(data.id),
      expiresAt: data.date_of_expiration ?? new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  },

  async consultarPagamento(ctx, txid) {
    if (getIntegracoesMode() === "homolog") {
      return { status: "pending" };
    }
    if (!requireCredentials(ctx, KEYS)) {
      throw new IntegrationNotAvailableError("mercado_pago", "Consultar pagamento");
    }
    const data = await callExternal("mercado_pago:get", () =>
      fetchJson<{ status: string; date_approved?: string }>(
        `https://api.mercadopago.com/v1/payments/${txid}`,
        { headers: { Authorization: `Bearer ${ctx.credentials.access_token}` } },
      ),
    );
    return {
      status: data.status,
      paidAt: data.date_approved,
    };
  },

  async cancelar(ctx, txid) {
    if (getIntegracoesMode() === "homolog") return;
    if (!requireCredentials(ctx, KEYS)) {
      throw new IntegrationNotAvailableError("mercado_pago", "Cancelar/Estornar PIX");
    }
    await callExternal("mercado_pago:refund", () =>
      fetchJson(`https://api.mercadopago.com/v1/payments/${txid}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.credentials.access_token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
  },

  async processarWebhook() {
    /* conciliado pelo webhook-processor */
  },

  async conciliar() {
    if (getIntegracoesMode() === "homolog") {
      return { matched: 1, pending: 0 };
    }
    return { matched: 0, pending: 0 };
  },
};

export const mercadoPagoProvider: IntegrationProvider = createHomologProvider({
  id: "mercado_pago",
  category: "pix",
  requiredCredentialKeys: KEYS,
  live: {
    async testarConexao(ctx) {
      const started = Date.now();
      if (!requireCredentials(ctx, KEYS)) {
        return { success: false, message: "access_token ausente", latencyMs: 0 };
      }
      try {
        await callExternal("mercado_pago:test", () =>
          fetchJson("https://api.mercadopago.com/users/me", {
            headers: { Authorization: `Bearer ${ctx.credentials.access_token}` },
          }),
        );
        return {
          success: true,
          message: "Mercado Pago OK",
          latencyMs: Date.now() - started,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Falha",
          latencyMs: Date.now() - started,
        };
      }
    },
  },
});
