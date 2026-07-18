import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type ExpedicaoComPedido = Tables<"expedicoes"> & {
  pedidos: Pick<Tables<"pedidos">, "id" | "numero" | "tipo" | "total"> & {
    clientes: Pick<Tables<"clientes">, "id" | "nome"> | null;
  };
  entregadores: Pick<Tables<"entregadores">, "id" | "nome"> | null;
};

export async function listarExpedicoesAbertas(): Promise<ExpedicaoComPedido[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expedicoes")
    .select("*, pedidos(id, numero, tipo, total, clientes(id, nome)), entregadores(id, nome)")
    .eq("empresa_id", empresa.id)
    .neq("status", "entregue")
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return data as unknown as ExpedicaoComPedido[];
}

export async function listarEntregadoresAtivos(): Promise<Tables<"entregadores">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entregadores")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}
