import { createHomologProvider } from "../homolog/create-homolog-provider";
import { fetchJson } from "../http-client";
import { getIntegracoesMode, providerBaseUrl, requireCredentials } from "../mode";
import { callExternal } from "../resilience";
import type { IntegrationProvider, PixGateway } from "../types";
import { IntegrationNotAvailableError } from "../types";

const KEYS = ["api_key"];

function asaasBase(): string {
  return providerBaseUrl("ASAAS_API_BASE_URL", "https://sandbox.asaas.com/api/v3");
}

export const asaasProviderPix: PixGateway = {
  async gerarQrCode(ctx, input) {
    if (getIntegracoesMode() === "homolog") {
      const txid = `asaas_homolog_${Date.now()}`;
      return {
        qrCode: `PIX-HOMOLOG-${txid}-${input.amount}`,
        txid,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    }
    if (!requireCredentials(ctx, KEYS)) {
      throw new IntegrationNotAvailableError("asaas", "Gerar QR Code PIX");
    }
    const customerId = ctx.credentials.customer_id || "cus_homolog";
    const data = await callExternal("asaas:pix", () =>
      fetchJson<{ id: string; encodedImage?: string; payload?: string; expirationDate?: string }>(
        `${asaasBase()}/pix/qrCodes/static`,
        {
          method: "POST",
          headers: {
            access_token: ctx.credentials.api_key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            addressKey: ctx.credentials.pix_key,
            description: input.description,
            value: input.amount,
            format: "PAYLOAD",
            expirationSeconds: 1800,
            allowsMultiplePayments: false,
            externalReference: input.externalRef,
            customer: customerId,
          }),
        },
      ),
    );
    return {
      qrCode: data.payload ?? data.encodedImage ?? "",
      txid: data.id,
      expiresAt: data.expirationDate ?? new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  },

  async consultarPagamento(ctx, txid) {
    if (getIntegracoesMode() === "homolog") return { status: "PENDING" };
    if (!requireCredentials(ctx, KEYS)) {
      throw new IntegrationNotAvailableError("asaas", "Consultar pagamento");
    }
    const data = await callExternal("asaas:get", () =>
      fetchJson<{ status: string; paymentDate?: string }>(`${asaasBase()}/payments/${txid}`, {
        headers: { access_token: ctx.credentials.api_key },
      }),
    );
    return { status: data.status, paidAt: data.paymentDate };
  },

  async cancelar(ctx, txid) {
    if (getIntegracoesMode() === "homolog") return;
    if (!requireCredentials(ctx, KEYS)) {
      throw new IntegrationNotAvailableError("asaas", "Estorno PIX");
    }
    await callExternal("asaas:refund", () =>
      fetchJson(`${asaasBase()}/payments/${txid}/refund`, {
        method: "POST",
        headers: {
          access_token: ctx.credentials.api_key,
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
  },

  async processarWebhook() {},

  async conciliar() {
    return getIntegracoesMode() === "homolog"
      ? { matched: 1, pending: 0 }
      : { matched: 0, pending: 0 };
  },
};

export const asaasProvider: IntegrationProvider = createHomologProvider({
  id: "asaas",
  category: "pix",
  requiredCredentialKeys: KEYS,
  live: {
    async testarConexao(ctx) {
      const started = Date.now();
      if (!requireCredentials(ctx, KEYS)) {
        return { success: false, message: "api_key ausente", latencyMs: 0 };
      }
      try {
        await callExternal("asaas:test", () =>
          fetchJson(`${asaasBase()}/finance/balance`, {
            headers: { access_token: ctx.credentials.api_key },
          }),
        );
        return {
          success: true,
          message: "Asaas OK",
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
