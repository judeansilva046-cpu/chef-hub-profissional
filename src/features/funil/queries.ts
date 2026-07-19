import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function listarEtapasFunil(): Promise<Tables<"crm_funil_etapas">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_funil_etapas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listarLeadsAbertos(): Promise<Tables<"crm_leads">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_leads")
    .select("*")
    .eq("empresa_id", empresa.id)
    .neq("status", "convertido")
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
