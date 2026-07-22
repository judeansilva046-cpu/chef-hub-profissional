import { createHomologProvider } from "../homolog/create-homolog-provider";
import { fetchJson } from "../http-client";
import { getIntegracoesMode, requireCredentials } from "../mode";
import { callExternal } from "../resilience";
import type {
  IntegrationProvider,
  ProviderContext,
  WhatsAppCapabilities,
} from "../types";
import { IntegrationNotAvailableError } from "../types";

const KEYS = ["access_token", "phone_number_id"];

async function graphSend(
  ctx: ProviderContext,
  body: Record<string, unknown>,
): Promise<{ messageId: string }> {
  if (getIntegracoesMode() === "homolog") {
    return { messageId: `wa_homolog_${Date.now()}` };
  }
  if (!requireCredentials(ctx, KEYS)) {
    throw new IntegrationNotAvailableError("whatsapp_cloud", "Enviar mensagem");
  }
  const phoneId = ctx.credentials.phone_number_id;
  const data = await callExternal("whatsapp_cloud:send", () =>
    fetchJson<{ messages?: Array<{ id: string }> }>(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.credentials.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    ),
  );
  return { messageId: data.messages?.[0]?.id ?? `wa_${Date.now()}` };
}

export const whatsappCloudProviderWhatsApp: WhatsAppCapabilities = {
  async enviarMensagem(ctx, to, text) {
    return graphSend(ctx, {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body: text },
    });
  },

  async enviarTemplate(ctx, to, template, params = {}) {
    const components = Object.keys(params).length
      ? [
          {
            type: "body",
            parameters: Object.values(params).map((text) => ({ type: "text", text })),
          },
        ]
      : [];
    return graphSend(ctx, {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "template",
      template: {
        name: template,
        language: { code: "pt_BR" },
        components,
      },
    });
  },

  async notificarStatusPedido(ctx, to, orderStatus) {
    const map: Record<string, string> = {
      confirmado: "Pedido confirmado! Já estamos preparando.",
      pronto: "Seu pedido está pronto!",
      saiu_para_entrega: "Seu pedido saiu para entrega.",
      entregue: "Pedido entregue. Bom apetite!",
      cancelado: "Seu pedido foi cancelado.",
    };
    const body = map[orderStatus] ?? `Atualização do pedido: ${orderStatus}`;
    await whatsappCloudProviderWhatsApp.enviarMensagem(ctx, to, body);
  },
};

export const whatsappCloudProvider: IntegrationProvider = createHomologProvider({
  id: "whatsapp_cloud",
  category: "whatsapp",
  requiredCredentialKeys: KEYS,
  live: {
    async testarConexao(ctx) {
      const started = Date.now();
      if (!requireCredentials(ctx, KEYS)) {
        return { success: false, message: "Credenciais ausentes", latencyMs: 0 };
      }
      try {
        await callExternal("whatsapp_cloud:test", () =>
          fetchJson(
            `https://graph.facebook.com/v19.0/${ctx.credentials.phone_number_id}`,
            { headers: { Authorization: `Bearer ${ctx.credentials.access_token}` } },
          ),
        );
        return {
          success: true,
          message: "WhatsApp Cloud API OK",
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
