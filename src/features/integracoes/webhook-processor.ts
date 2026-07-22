import "server-only";

import { resolverProvider } from "@/integrations/registry";
import { idempotencyKey, rememberIdempotentAsync } from "@/integrations/resilience";
import { isProviderId } from "@/integrations/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

import { registrarLogIntegracao } from "./monitoring";

export type ProcessedWebhookEvent = {
  provider: string;
  eventType: string;
  externalId: string | null;
  action: "order_created" | "order_status" | "order_cancelled" | "payment" | "ignored";
};

function detectEvent(provider: string, payload: Record<string, unknown>): ProcessedWebhookEvent {
  const code = String(payload.code ?? payload.event ?? payload.type ?? "");
  const externalId = String(
    payload.orderId ?? payload.id ?? payload.payment_id ?? payload.externalId ?? "",
  ) || null;

  if (provider === "ifood" || provider.includes("food") || provider === "open_delivery") {
    // iFood: CAN / CANCELLED; demais marketplaces: CANCEL*
    if (/^(CAN|CANCELLED)$/i.test(code) || /CANCEL/i.test(code)) {
      return { provider, eventType: code || "CANCELLED", externalId, action: "order_cancelled" };
    }
    if (/PLC|NEW|CREATED|PLACED/i.test(code) || code === "") {
      return { provider, eventType: code || "NEW", externalId, action: "order_created" };
    }
    return { provider, eventType: code || "STATUS", externalId, action: "order_status" };
  }

  if (["mercado_pago", "asaas", "pagseguro", "stone", "cielo"].includes(provider)) {
    return { provider, eventType: code || "payment.updated", externalId, action: "payment" };
  }

  return { provider, eventType: code || "unknown", externalId, action: "ignored" };
}

/**
 * Processa webhooks pendentes: idempotência + classificação de eventos.
 * Em homologação não cria pedidos reais — registra métricas/logs para reconciliação.
 */
export async function processPendingWebhooks(limit = 20): Promise<number> {
  const supabase = createServiceRoleClient();
  const { data: rows } = await supabase
    .from("integration_webhooks")
    .select("id, provider, empresa_id, integration_id, payload")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(limit);

  let processed = 0;
  for (const row of rows ?? []) {
    if (!isProviderId(row.provider)) continue;
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const event = detectEvent(row.provider, payload);
    const key = idempotencyKey(row.provider, "webhook", {
      id: row.id,
      externalId: event.externalId,
      eventType: event.eventType,
    });

    await rememberIdempotentAsync(key, 24 * 60 * 60_000, async () => {
      const provider = resolverProvider(row.provider);
      void provider;

      await supabase
        .from("integration_webhooks")
        .update({
          processed: true,
          event_type: event.eventType,
          idempotency_key: key,
        })
        .eq("id", row.id);

      if (row.empresa_id) {
        void registrarLogIntegracao({
          empresaId: row.empresa_id,
          integrationId: row.integration_id,
          level: "INFO",
          eventType: "webhook_processed",
          message: `${row.provider}: ${event.action} (${event.eventType})`,
          payload: { externalId: event.externalId, action: event.action },
        });

        try {
          await supabase.from("integration_metrics").upsert(
            {
              empresa_id: row.empresa_id,
              provider: row.provider,
              metric_date: new Date().toISOString().slice(0, 10),
              webhooks_received: 1,
            },
            { onConflict: "empresa_id,provider,metric_date" },
          );
        } catch {
          /* migration 0052 opcional em ambientes ainda sem tabela */
        }
      }

      return event;
    });

    processed += 1;
  }

  return processed;
}

export function classifyWebhookEvent(
  provider: string,
  payload: Record<string, unknown>,
): ProcessedWebhookEvent {
  return detectEvent(provider, payload);
}
