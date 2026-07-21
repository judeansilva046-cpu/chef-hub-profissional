import "server-only";

import {
  PROVIDER_CATALOG,
  type IntegrationCategory,
  type IntegrationProviderId,
  type ProviderCatalogItem,
} from "@/integrations/types";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type IntegrationRow = {
  id: string;
  empresa_id: string;
  provider: string;
  category: string;
  status: string;
  config: Record<string, unknown>;
  webhook_url: string | null;
  last_sync_at: string | null;
  last_test_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  has_credentials: boolean;
};

export type IntegrationHubItem = {
  catalog: ProviderCatalogItem;
  integration: IntegrationRow | null;
};

export async function listarCentralIntegracoes(opts?: {
  category?: IntegrationCategory;
}): Promise<IntegrationHubItem[]> {
  const empresa = await getEmpresaAtual();
  const catalog = opts?.category
    ? PROVIDER_CATALOG.filter((p) => p.category === opts.category)
    : [...PROVIDER_CATALOG];

  if (!empresa) {
    return catalog.map((item) => ({ catalog: item, integration: null }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integrations")
    .select(
      "id, empresa_id, provider, category, status, config, webhook_url, last_sync_at, last_test_at, last_error, metadata, created_at, updated_at",
    )
    .eq("empresa_id", empresa.id);

  if (error) throw error;

  const { data: creds } = await supabase
    .from("integration_credentials")
    .select("integration_id")
    .eq("empresa_id", empresa.id);

  const credSet = new Set((creds ?? []).map((c) => c.integration_id));
  const byProvider = new Map(
    (data ?? []).map((row) => [
      row.provider,
      {
        ...row,
        config: (row.config ?? {}) as Record<string, unknown>,
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        has_credentials: credSet.has(row.id),
      } satisfies IntegrationRow,
    ]),
  );

  return catalog.map((item) => ({
    catalog: item,
    integration: byProvider.get(item.id) ?? null,
  }));
}

/** @deprecated use listarCentralIntegracoes */
export async function listarIntegracoesPorProvedor() {
  const items = await listarCentralIntegracoes();
  return items.map((item) => ({
    provedor: item.catalog.id as IntegrationProviderId,
    label: item.catalog.label,
    integracao: item.integration
      ? {
          id: item.integration.id,
          empresa_id: item.integration.empresa_id,
          provedor: item.integration.provider,
          status_conexao: mapStatusLegacy(item.integration.status),
          conectado_em:
            item.integration.status === "online"
              ? item.integration.updated_at
              : null,
          metadata: item.integration.metadata,
          criado_em: item.integration.created_at,
          atualizado_em: item.integration.updated_at,
          tem_credenciais: item.integration.has_credentials,
        }
      : null,
  }));
}

function mapStatusLegacy(status: string): string {
  switch (status) {
    case "online":
      return "conectado";
    case "pending":
      return "pendente_homologacao";
    case "error":
      return "erro";
    case "disabled":
      return "desconectado";
    default:
      return "nao_configurado";
  }
}

export type IntegracaoListagem = NonNullable<
  Awaited<ReturnType<typeof listarIntegracoesPorProvedor>>[number]["integracao"]
>;

export async function listarLogsIntegracao(opts?: {
  integrationId?: string;
  limit?: number;
}) {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let q = supabase
    .from("integration_logs")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 40);

  if (opts?.integrationId) q = q.eq("integration_id", opts.integrationId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listarSyncsIntegracao(opts?: {
  integrationId?: string;
  limit?: number;
}) {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let q = supabase
    .from("integration_syncs")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("started_at", { ascending: false })
    .limit(opts?.limit ?? 30);

  if (opts?.integrationId) q = q.eq("integration_id", opts.integrationId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function listarFalhasIntegracao(limit = 20) {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_failures")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function listarWebhooksIntegracao(limit = 20) {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_webhooks")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Legado Sprint 04 */
export async function listarLogsSincronizacao(integracaoId: string) {
  return listarLogsIntegracao({ integrationId: integracaoId, limit: 20 });
}

export async function listarWebhooksRecebidos() {
  return listarWebhooksIntegracao(20);
}

export async function obterStatusIntegracoes() {
  const items = await listarCentralIntegracoes();
  const totals = {
    total: items.length,
    online: 0,
    offline: 0,
    pending: 0,
    error: 0,
    withCredentials: 0,
  };
  for (const item of items) {
    const status = item.integration?.status ?? "offline";
    if (status === "online") totals.online += 1;
    else if (status === "pending") totals.pending += 1;
    else if (status === "error") totals.error += 1;
    else totals.offline += 1;
    if (item.integration?.has_credentials) totals.withCredentials += 1;
  }
  return totals;
}
