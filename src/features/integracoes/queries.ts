import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { PROVEDORES_INTEGRACAO } from "@/integrations/types";

export type IntegracaoPorProvedor = {
  provedor: (typeof PROVEDORES_INTEGRACAO)[number]["value"];
  label: string;
  integracao: Tables<"integracoes_canais"> | null;
};

/** Sempre retorna os 4 provedores, mesmo os nunca configurados (integracao=null) — a UI mostra todos com status "não configurado". */
export async function listarIntegracoesPorProvedor(): Promise<IntegracaoPorProvedor[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return PROVEDORES_INTEGRACAO.map((item) => ({
      provedor: item.value,
      label: item.label,
      integracao: null,
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integracoes_canais")
    .select("*")
    .eq("empresa_id", empresa.id);

  if (error) throw error;

  const porProvedor = new Map((data ?? []).map((item) => [item.provedor, item]));

  return PROVEDORES_INTEGRACAO.map((item) => ({
    provedor: item.value,
    label: item.label,
    integracao: porProvedor.get(item.value) ?? null,
  }));
}

export async function listarLogsSincronizacao(
  integracaoId: string,
): Promise<Tables<"integracoes_logs_sincronizacao">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integracoes_logs_sincronizacao")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("integracao_id", integracaoId)
    .order("criado_em", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function listarWebhooksRecebidos(): Promise<
  Tables<"integracoes_webhooks_recebidos">[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integracoes_webhooks_recebidos")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}
