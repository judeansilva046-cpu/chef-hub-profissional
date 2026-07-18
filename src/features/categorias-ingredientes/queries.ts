import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function listarCategoriasIngredientes(): Promise<
  Tables<"categorias_ingredientes">[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias_ingredientes")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}
