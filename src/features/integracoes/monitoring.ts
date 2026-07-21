import "server-only";

import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";
import { criarAlerta } from "@/server/observabilidade/alerts";
import { registrarLog } from "@/server/observabilidade/logs";
import { registrarPerformance } from "@/server/observabilidade/logs";

export async function registrarLogIntegracao(input: {
  empresaId: string;
  integrationId?: string | null;
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  eventType: string;
  message: string;
  payload?: Record<string, unknown>;
  durationMs?: number;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("integration_logs").insert({
      empresa_id: input.empresaId,
      integration_id: input.integrationId ?? null,
      level: input.level,
      event_type: input.eventType,
      message: input.message,
      payload: (input.payload ?? {}) as never,
      duration_ms: input.durationMs ?? null,
    });
  } catch (error) {
    console.error("[integration_logs]", error);
  }

  void registrarLog({
    nivel: input.level,
    modulo: "integracoes",
    mensagem: input.message,
    detalhes: {
      eventType: input.eventType,
      integrationId: input.integrationId,
      ...(input.payload ?? {}),
    },
    empresaId: input.empresaId,
    duracaoMs: input.durationMs,
  });
}

export async function registrarFalhaIntegracao(input: {
  empresaId: string;
  integrationId?: string | null;
  operation: string;
  errorMessage: string;
  responseMs?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("integration_failures").insert({
      empresa_id: input.empresaId,
      integration_id: input.integrationId ?? null,
      operation: input.operation,
      attempt: 1,
      error_message: input.errorMessage,
      response_ms: input.responseMs ?? null,
      metadata: (input.metadata ?? {}) as never,
    });
  } catch (error) {
    console.error("[integration_failures]", error);
  }

  void criarAlerta({
    tipo: "erro_integracao",
    severidade: "error",
    titulo: "Falha de integração",
    mensagem: `${input.operation}: ${input.errorMessage}`,
    entidade: "integrations",
    registroId: input.integrationId ?? undefined,
    metadados: input.metadata,
  });

  void registrarLogIntegracao({
    empresaId: input.empresaId,
    integrationId: input.integrationId,
    level: "ERROR",
    eventType: input.operation,
    message: input.errorMessage,
    durationMs: input.responseMs,
    payload: input.metadata,
  });
}

export async function registrarEventoIntegracao(input: {
  empresaId: string;
  integrationId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("integration_events").insert({
      empresa_id: input.empresaId,
      integration_id: input.integrationId ?? null,
      event_type: input.eventType,
      payload: (input.payload ?? {}) as never,
    });
  } catch (error) {
    console.error("[integration_events]", error);
  }

  void registrarAuditoria({
    acao: input.eventType,
    entidade: "integrations",
    registroId: input.integrationId,
    empresaId: input.empresaId,
    metadados: input.payload,
  });
}

export async function medirOperacaoIntegracao<T>(
  nome: string,
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const t0 = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - t0;
    if (durationMs >= 300) {
      void registrarPerformance({
        tipo: "rpc",
        nome: `integracao:${nome}`,
        duracaoMs: durationMs,
      });
    }
    return { result, durationMs };
  } catch (error) {
    const durationMs = Date.now() - t0;
    if (durationMs >= 300) {
      void registrarPerformance({
        tipo: "rpc",
        nome: `integracao:${nome}`,
        duracaoMs: durationMs,
        metadados: { error: true },
      });
    }
    throw error;
  }
}
