import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export async function buscarConfigFidelidade(): Promise<Tables<"crm_fidelidade_config"> | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_fidelidade_config")
    .select("*")
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listarNiveisFidelidade(): Promise<Tables<"crm_fidelidade_niveis">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_fidelidade_niveis")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export interface ClienteComSaldoPontos {
  id: string;
  nome: string;
  saldo: number;
}

/** `clientes` e a view `crm_fidelidade_saldos` não têm FK entre si — merge em memória (mesmo padrão de buscarClientesComMetricas). */
export async function listarClientesComSaldoPontos(): Promise<ClienteComSaldoPontos[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const [{ data: clientes, error: errorClientes }, { data: saldos, error: errorSaldos }] =
    await Promise.all([
      supabase.from("clientes").select("id, nome").eq("empresa_id", empresa.id).eq("ativo", true),
      supabase.from("crm_fidelidade_saldos").select("*").eq("empresa_id", empresa.id),
    ]);

  if (errorClientes) throw errorClientes;
  if (errorSaldos) throw errorSaldos;

  const saldoPorCliente = new Map((saldos ?? []).map((linha) => [linha.cliente_id, linha.saldo]));

  return (clientes ?? [])
    .map((cliente) => ({ id: cliente.id, nome: cliente.nome, saldo: saldoPorCliente.get(cliente.id) ?? 0 }))
    .filter((cliente) => cliente.saldo !== 0)
    .sort((a, b) => b.saldo - a.saldo);
}

/** empresa_id filtrado explicitamente além de cliente_id (mesmo padrão de buscarContaPagarPorId): RLS já isola por empresa, o filtro aqui é defesa em profundidade — nunca confiar só num filtro para não vazar saldo de cliente de outra empresa. */
export async function buscarSaldoPontosCliente(clienteId: string): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_fidelidade_saldos")
    .select("saldo")
    .eq("cliente_id", clienteId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  return data?.saldo ?? 0;
}

export async function listarExtratoPontos(clienteId: string): Promise<Tables<"crm_fidelidade_movimentacoes">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_fidelidade_movimentacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
