import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

/**
 * Unidades globais do sistema (empresa_id null) + as customizadas da
 * empresa ativa. RLS já impede ver unidades de OUTRA empresa, mas não
 * escolhe qual empresa mostrar quando o usuário tem mais de uma — por isso
 * o filtro explícito por empresa_id aqui.
 */
export async function listarUnidadesMedida(): Promise<
  Tables<"unidades_medida">[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unidades_medida")
    .select("*")
    .or(`empresa_id.is.null,empresa_id.eq.${empresa.id}`)
    .order("empresa_id", { ascending: true, nullsFirst: true })
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}
