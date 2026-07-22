import "server-only";

import { createClient } from "@/lib/supabase/server";
import { evolutionApiProviderWhatsApp } from "@/integrations/whatsapp/evolution_api";
import { whatsappCloudProviderWhatsApp } from "@/integrations/whatsapp/whatsapp_cloud";
import {
  IntegrationNotAvailableError,
  type ProviderContext,
  type WhatsAppCapabilities,
} from "@/integrations/types";

import { renderTemplate } from "./calculations";

export type CanalComunicacao = "whatsapp" | "email" | "sms" | "push";

function whatsappCapability(providerId: string | null | undefined): WhatsAppCapabilities {
  if (providerId === "evolution_api") return evolutionApiProviderWhatsApp;
  return whatsappCloudProviderWhatsApp;
}

function credentialsWhatsApp(providerId: string): Record<string, string> {
  if (providerId === "evolution_api") {
    return {
      base_url: process.env.EVOLUTION_API_BASE_URL ?? "",
      api_key: process.env.EVOLUTION_API_KEY ?? "",
      instance: process.env.EVOLUTION_INSTANCE ?? "",
    };
  }
  return {
    access_token: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  };
}

/**
 * Envia mensagem via Central de Integrações (homolog/live Sprint 18)
 * e registra em communication_logs. Respeita consentimento LGPD.
 */
export async function enviarComunicacaoCliente(input: {
  empresaId: string;
  clienteId: string;
  channel: CanalComunicacao;
  to: string | null | undefined;
  body: string;
  vars?: Record<string, string>;
  campaignId?: string | null;
  consentOk: boolean;
  providerId?: string | null;
}): Promise<{ status: "sent" | "failed" | "skipped" | "queued"; error?: string }> {
  const supabase = await createClient();
  const body = renderTemplate(input.body, input.vars ?? {});

  if (!input.consentOk) {
    await supabase.from("communication_logs").insert({
      empresa_id: input.empresaId,
      cliente_id: input.clienteId,
      campaign_id: input.campaignId ?? null,
      channel: input.channel,
      provider_id: input.providerId ?? null,
      status: "skipped",
      to_address: input.to ?? null,
      body,
      error_message: "Sem consentimento LGPD para este canal.",
    });
    return { status: "skipped", error: "Sem consentimento." };
  }

  if (!input.to) {
    await supabase.from("communication_logs").insert({
      empresa_id: input.empresaId,
      cliente_id: input.clienteId,
      campaign_id: input.campaignId ?? null,
      channel: input.channel,
      status: "skipped",
      body,
      error_message: "Destinatário ausente.",
    });
    return { status: "skipped", error: "Destinatário ausente." };
  }

  if (input.channel === "whatsapp") {
    const providerId = input.providerId ?? "whatsapp_cloud";
    const ctx: ProviderContext = {
      empresaId: input.empresaId,
      integrationId: "crm-outbound",
      credentials: credentialsWhatsApp(providerId),
      config: { providerId },
    };
    try {
      const cap = whatsappCapability(providerId);
      const result = await cap.enviarMensagem(ctx, input.to, body);
      await supabase.from("communication_logs").insert({
        empresa_id: input.empresaId,
        cliente_id: input.clienteId,
        campaign_id: input.campaignId ?? null,
        channel: "whatsapp",
        provider_id: providerId,
        status: "sent",
        to_address: input.to,
        body,
        metadata: { messageId: result.messageId },
      });
      return { status: "sent" };
    } catch (error) {
      const message =
        error instanceof IntegrationNotAvailableError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha no envio.";
      await supabase.from("communication_logs").insert({
        empresa_id: input.empresaId,
        cliente_id: input.clienteId,
        campaign_id: input.campaignId ?? null,
        channel: "whatsapp",
        provider_id: providerId,
        status: "failed",
        to_address: input.to,
        body,
        error_message: message,
      });
      return { status: "failed", error: message };
    }
  }

  // email / sms / push — estrutura pronta, fila local até homologação
  await supabase.from("communication_logs").insert({
    empresa_id: input.empresaId,
    cliente_id: input.clienteId,
    campaign_id: input.campaignId ?? null,
    channel: input.channel,
    provider_id: input.providerId ?? null,
    status: "queued",
    to_address: input.to,
    body,
    metadata: { note: "Canal estruturado — envio real na Sprint 18." },
  });
  return { status: "queued" };
}
