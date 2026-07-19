import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export interface ListarTarefasParams {
  status?: string;
}

export async function listarTarefas({ status }: ListarTarefasParams = {}): Promise<Tables<"crm_tarefas">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase.from("crm_tarefas").select("*").eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("prazo", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function listarTarefasPorReferencia(
  referenciaTipo: "cliente" | "lead",
  referenciaId: string,
): Promise<Tables<"crm_tarefas">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_tarefas")
    .select("*")
    .eq("referencia_tipo", referenciaTipo)
    .eq("referencia_id", referenciaId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
