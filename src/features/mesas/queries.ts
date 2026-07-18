import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function listarMesas(): Promise<Tables<"mesas">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mesas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("identificador", { ascending: true });

  if (error) throw error;
  return data;
}

export type ComandaComPedidos = Tables<"comandas"> & {
  pedidos: Pick<Tables<"pedidos">, "id" | "numero" | "status" | "total">[];
};

export interface MesaDetalhada {
  mesa: Tables<"mesas">;
  comandaAberta: ComandaComPedidos | null;
}

export async function buscarMesaDetalhada(id: string): Promise<MesaDetalhada | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data: mesa, error: erroMesa } = await supabase
    .from("mesas")
    .select("*")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (erroMesa) throw erroMesa;
  if (!mesa) return null;

  const { data: comanda, error: erroComanda } = await supabase
    .from("comandas")
    .select("*, pedidos(id, numero, status, total)")
    .eq("mesa_id", id)
    .eq("status", "aberta")
    .maybeSingle();

  if (erroComanda) throw erroComanda;

  return {
    mesa,
    comandaAberta: comanda as unknown as ComandaComPedidos | null,
  };
}

/** Comandas abertas de OUTRAS mesas — usado no seletor de "unir mesas"/"transferir". */
export async function listarComandasAbertas(excluirComandaId?: string): Promise<
  (Tables<"comandas"> & { mesas: Pick<Tables<"mesas">, "id" | "identificador"> | null })[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("comandas")
    .select("*, mesas(id, identificador)")
    .eq("empresa_id", empresa.id)
    .eq("status", "aberta");

  if (excluirComandaId) query = query.neq("id", excluirComandaId);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as (Tables<"comandas"> & {
    mesas: Pick<Tables<"mesas">, "id" | "identificador"> | null;
  })[];
}
