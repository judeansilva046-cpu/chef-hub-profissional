import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function buscarConfigCashback(): Promise<Tables<"crm_cashback_config"> | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cashback_config")
    .select("*")
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface ClienteComSaldoCashback {
  id: string;
  nome: string;
  saldo: number;
}

export async function listarClientesComSaldoCashback(): Promise<ClienteComSaldoCashback[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const [{ data: clientes, error: errorClientes }, { data: saldos, error: errorSaldos }] =
    await Promise.all([
      supabase.from("clientes").select("id, nome").eq("empresa_id", empresa.id).eq("ativo", true),
      supabase.from("crm_cashback_saldos").select("*").eq("empresa_id", empresa.id),
    ]);

  if (errorClientes) throw errorClientes;
  if (errorSaldos) throw errorSaldos;

  const saldoPorCliente = new Map((saldos ?? []).map((linha) => [linha.cliente_id, linha.saldo]));

  return (clientes ?? [])
    .map((cliente) => ({ id: cliente.id, nome: cliente.nome, saldo: saldoPorCliente.get(cliente.id) ?? 0 }))
    .filter((cliente) => cliente.saldo !== 0)
    .sort((a, b) => b.saldo - a.saldo);
}

/** empresa_id filtrado explicitamente além de cliente_id — defesa em profundidade (mesmo padrão de buscarContaPagarPorId), RLS já isola por empresa. */
export async function buscarSaldoCashbackCliente(clienteId: string): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cashback_saldos")
    .select("saldo")
    .eq("cliente_id", clienteId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data?.saldo ?? 0;
}

export async function listarExtratoCashback(clienteId: string): Promise<Tables<"crm_cashback_movimentacoes">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cashback_movimentacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
