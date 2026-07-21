import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function listarFuncionarios(): Promise<Tables<"funcionarios">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}
