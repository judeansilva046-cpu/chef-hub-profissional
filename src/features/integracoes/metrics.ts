import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export interface PainelIntegracoesMetrics {
  webhooksRecebidos: number;
  falhas: number;
  retentativas: number;
  latenciaMediaMs: number | null;
  ultimaSync: string | null;
  jobsDlq: number;
  porProvider: Array<{
    provider: string;
    calls: number;
    failures: number;
    webhooks: number;
    avgLatencyMs: number;
    lastSyncAt: string | null;
  }>;
}

const EMPTY: PainelIntegracoesMetrics = {
  webhooksRecebidos: 0,
  falhas: 0,
  retentativas: 0,
  latenciaMediaMs: null,
  ultimaSync: null,
  jobsDlq: 0,
  porProvider: [],
};

/**
 * KPIs do painel de integrações.
 * Soft-fail quando a migration 0052 ainda não foi aplicada.
 */
export async function carregarMetricasIntegracoes(): Promise<PainelIntegracoesMetrics> {
  try {
    const empresa = await getEmpresaAtual();
    if (!empresa) return EMPTY;

    const supabase = await createClient();
    const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const [webhooks, failures, syncs, metrics, dlq] = await Promise.all([
      supabase
        .from("integration_webhooks")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresa.id)
        .gte("created_at", desde),
      supabase
        .from("integration_failures")
        .select("id, attempt", { count: "exact" })
        .eq("empresa_id", empresa.id)
        .gte("created_at", desde),
      supabase
        .from("integration_syncs")
        .select("finished_at, duration_ms")
        .eq("empresa_id", empresa.id)
        .order("started_at", { ascending: false })
        .limit(50),
      supabase
        .from("integration_metrics")
        .select("*")
        .eq("empresa_id", empresa.id)
        .gte("metric_date", desde.slice(0, 10)),
      supabase
        .from("integration_dlq")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresa.id),
    ]);

    const latencias = (syncs.data ?? [])
      .map((s) => s.duration_ms)
      .filter((n): n is number => typeof n === "number" && n >= 0);
    const latenciaMediaMs =
      latencias.length > 0
        ? Math.round(latencias.reduce((a, b) => a + b, 0) / latencias.length)
        : null;

    const retries = (failures.data ?? []).reduce(
      (s, f) => s + Math.max(0, Number(f.attempt ?? 1) - 1),
      0,
    );

    const porProviderMap = new Map<
      string,
      {
        provider: string;
        calls: number;
        failures: number;
        webhooks: number;
        avgLatencyMs: number;
        lastSyncAt: string | null;
      }
    >();

    for (const m of metrics.data ?? []) {
      const row = m as {
        provider: string;
        calls: number;
        failures: number;
        webhooks_received: number;
        avg_latency_ms: number;
        last_sync_at: string | null;
      };
      const atual = porProviderMap.get(row.provider) ?? {
        provider: row.provider,
        calls: 0,
        failures: 0,
        webhooks: 0,
        avgLatencyMs: 0,
        lastSyncAt: null,
      };
      atual.calls += Number(row.calls ?? 0);
      atual.failures += Number(row.failures ?? 0);
      atual.webhooks += Number(row.webhooks_received ?? 0);
      atual.avgLatencyMs = Number(row.avg_latency_ms ?? atual.avgLatencyMs);
      if (row.last_sync_at && (!atual.lastSyncAt || row.last_sync_at > atual.lastSyncAt)) {
        atual.lastSyncAt = row.last_sync_at;
      }
      porProviderMap.set(row.provider, atual);
    }

    return {
      webhooksRecebidos: webhooks.count ?? 0,
      falhas: failures.count ?? 0,
      retentativas: retries,
      latenciaMediaMs,
      ultimaSync: syncs.data?.[0]?.finished_at ?? null,
      jobsDlq: dlq.error ? 0 : (dlq.count ?? 0),
      porProvider: [...porProviderMap.values()].sort((a, b) => b.calls - a.calls),
    };
  } catch {
    return EMPTY;
  }
}
