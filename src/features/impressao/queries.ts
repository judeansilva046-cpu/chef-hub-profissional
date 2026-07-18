import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

/** Histórico de jobs de impressão de uma referência (pedido/comanda/caixa/expedição) — usado para mostrar status e permitir reimpressão nas telas de Pedido, Caixa e Expedição, sem duplicar a fila em cada feature. */
export async function listarImpressaoPorReferencia(
  referenciaTipo: string,
  referenciaId: string,
): Promise<Tables<"fila_impressao">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fila_impressao")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("referencia_tipo", referenciaTipo)
    .eq("referencia_id", referenciaId)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data;
}
