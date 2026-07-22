import "server-only";

import { getIntegracoesMode } from "@/integrations/mode";
import { resolverProvider } from "@/integrations/registry";
import { isProviderId } from "@/integrations/types";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { registrarLog } from "@/server/observabilidade/logs";

const MAX_PAYLOAD_BYTES = 64 * 1024;

export type WebhookInboxResult =
  | { ok: true; status: number; body: Record<string, unknown> }
  | { ok: false; status: number; body: Record<string, unknown> };

export async function processWebhookInbox(input: {
  provider: string;
  rawBody: string;
  headers: Headers;
}): Promise<WebhookInboxResult> {
  if (!isProviderId(input.provider)) {
    return {
      ok: false,
      status: 404,
      body: { error: "Provedor desconhecido." },
    };
  }

  if (input.rawBody.length > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      body: { error: "Payload muito grande." },
    };
  }

  let payload: Json;
  try {
    payload = input.rawBody ? (JSON.parse(input.rawBody) as Json) : null;
  } catch {
    return { ok: false, status: 400, body: { error: "Corpo inválido." } };
  }

  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return { ok: false, status: 400, body: { error: "Corpo inválido." } };
  }

  const provider = resolverProvider(input.provider);
  if (!provider) {
    return {
      ok: false,
      status: 404,
      body: { error: "Provedor não registrado." },
    };
  }

  const signatureValid = provider.validarAssinaturaWebhook(
    payload,
    input.headers,
  );
  // Homologação aceita unsigned por padrão; live exige assinatura ou flag explícita.
  const allowUnsigned =
    process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED === "true" ||
    (process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED !== "false" &&
      getIntegracoesMode() === "homolog");

  if (!signatureValid && !allowUnsigned) {
    return {
      ok: false,
      status: 401,
      body: { error: "Assinatura de webhook inválida ou não configurada." },
    };
  }

  const supabase = createServiceRoleClient();

  const { data: integration } = await supabase
    .from("integrations")
    .select("id, empresa_id")
    .eq("provider", input.provider)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("integration_webhooks").insert({
    provider: input.provider,
    integration_id: integration?.id ?? null,
    empresa_id: integration?.empresa_id ?? null,
    payload,
    signature_valid: signatureValid,
    processed: false,
    error_message: signatureValid
      ? null
      : "Recebido sem assinatura válida (modo desenvolvimento).",
  });

  if (error) {
    void registrarLog({
      nivel: "ERROR",
      modulo: "integracoes",
      mensagem: "Falha ao gravar webhook",
      detalhes: { provider: input.provider, error: error.message },
      empresaId: integration?.empresa_id ?? null,
    });
    return {
      ok: false,
      status: 500,
      body: { error: "Não foi possível registrar o webhook." },
    };
  }

  if (
    input.provider === "ifood" ||
    input.provider === "99food" ||
    input.provider === "keeta" ||
    input.provider === "open_delivery"
  ) {
    void supabase.from("integracoes_webhooks_recebidos").insert({
      provedor: input.provider,
      payload,
      assinatura_valida: signatureValid,
      processado: false,
      erro_mensagem: signatureValid
        ? null
        : "Recebido sem assinatura válida (modo desenvolvimento).",
    });
  }

  void registrarLog({
    nivel: "INFO",
    modulo: "integracoes",
    mensagem: `Webhook recebido: ${input.provider}`,
    detalhes: { signatureValid },
    empresaId: integration?.empresa_id ?? null,
  });

  // Reconciliação assíncrona (best-effort) — classifica eventos pendentes.
  void import("./webhook-processor")
    .then((m) => m.processPendingWebhooks(5))
    .catch(() => undefined);

  return {
    ok: true,
    status: 200,
    body: { received: true, signature_valid: signatureValid },
  };
}
