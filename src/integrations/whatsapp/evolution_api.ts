import { createHomologProvider } from "../homolog/create-homolog-provider";
import { fetchJson } from "../http-client";
import { getIntegracoesMode, providerBaseUrl, requireCredentials } from "../mode";
import { callExternal } from "../resilience";
import type {
  IntegrationProvider,
  ProviderContext,
  WhatsAppCapabilities,
} from "../types";
import { IntegrationNotAvailableError } from "../types";

const KEYS = ["base_url", "api_key", "instance"];

function evolutionBase(ctx: ProviderContext): string {
  return (ctx.credentials.base_url || providerBaseUrl("EVOLUTION_API_BASE_URL", "")).replace(
    /\/$/,
    "",
  );
}

async function evolutionSend(
  ctx: ProviderContext,
  path: string,
  body: Record<string, unknown>,
): Promise<{ messageId: string }> {
  if (getIntegracoesMode() === "homolog") {
    return { messageId: `evo_homolog_${Date.now()}` };
  }
  if (!requireCredentials(ctx, KEYS)) {
    throw new IntegrationNotAvailableError("evolution_api", "Enviar mensagem");
  }
  const data = await callExternal("evolution_api:send", () =>
    fetchJson<{ key?: { id?: string } }>(`${evolutionBase(ctx)}${path}`, {
      method: "POST",
      headers: {
        apikey: ctx.credentials.api_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
  return { messageId: data.key?.id ?? `evo_${Date.now()}` };
}

export const evolutionApiProviderWhatsApp: WhatsAppCapabilities = {
  async enviarMensagem(ctx, to, text) {
    const instance = ctx.credentials.instance;
    return evolutionSend(ctx, `/message/sendText/${instance}`, {
      number: to.replace(/\D/g, ""),
      text,
    });
  },

  async enviarTemplate(ctx, to, template, params = {}) {
    const text = Object.entries(params).reduce(
      (acc, [k, v]) => acc.replace(`{{${k}}}`, v),
      template,
    );
    return evolutionApiProviderWhatsApp.enviarMensagem(ctx, to, text);
  },

  async notificarStatusPedido(ctx, to, orderStatus) {
    const map: Record<string, string> = {
      confirmado: "✅ Pedido confirmado!",
      pronto: "🍽️ Pedido pronto para retirada/entrega.",
      saiu_para_entrega: "🛵 Saiu para entrega.",
      entregue: "📦 Entregue!",
      cancelado: "❌ Pedido cancelado.",
    };
    await evolutionApiProviderWhatsApp.enviarMensagem(
      ctx,
      to,
      map[orderStatus] ?? `Status: ${orderStatus}`,
    );
  },
};

export const evolutionApiProvider: IntegrationProvider = createHomologProvider({
  id: "evolution_api",
  category: "whatsapp",
  requiredCredentialKeys: KEYS,
  live: {
    async testarConexao(ctx) {
      const started = Date.now();
      if (!requireCredentials(ctx, KEYS)) {
        return { success: false, message: "Credenciais ausentes", latencyMs: 0 };
      }
      try {
        await callExternal("evolution_api:test", () =>
          fetchJson(`${evolutionBase(ctx)}/instance/connectionState/${ctx.credentials.instance}`, {
            headers: { apikey: ctx.credentials.api_key },
          }),
        );
        return {
          success: true,
          message: "Evolution API OK",
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
