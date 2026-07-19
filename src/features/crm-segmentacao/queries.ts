import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import type { ClienteComMetricas } from "./calculations";

/**
 * `clientes` e a view `crm_clientes_metricas` (0045) não têm FK entre si
 * (a view é derivada, não uma tabela relacionável pelo PostgREST) — por
 * isso duas consultas + merge em memória, em vez de um único `select` com
 * embed.
 */
export async function buscarClientesComMetricas(): Promise<ClienteComMetricas[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();

  const [{ data: clientes, error: errorClientes }, { data: metricas, error: errorMetricas }] =
    await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, email, telefone, segmento, tags, ativo, origem, data_nascimento, criado_em")
        .eq("empresa_id", empresa.id)
        .eq("ativo", true),
      supabase
        .from("crm_clientes_metricas")
        .select("*")
        .eq("empresa_id", empresa.id),
    ]);

  if (errorClientes) throw errorClientes;
  if (errorMetricas) throw errorMetricas;

  const metricasPorCliente = new Map((metricas ?? []).map((linha) => [linha.cliente_id, linha]));

  return (clientes ?? []).map((cliente) => {
    const metrica = metricasPorCliente.get(cliente.id);
    return {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      segmento: cliente.segmento,
      tags: cliente.tags ?? [],
      ativo: cliente.ativo,
      origem: cliente.origem,
      dataNascimento: cliente.data_nascimento,
      criadoEm: cliente.criado_em,
      totalGasto: metrica?.total_gasto ?? 0,
      quantidadeCompras: metrica?.quantidade_compras ?? 0,
      ticketMedio: metrica?.ticket_medio ?? 0,
      primeiraCompra: metrica?.primeira_compra ?? null,
      ultimaCompra: metrica?.ultima_compra ?? null,
      diasDesdeUltimaCompra: metrica?.dias_desde_ultima_compra ?? null,
    };
  });
}

export async function listarSegmentosPersonalizados(): Promise<Tables<"crm_segmentos_personalizados">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_segmentos_personalizados")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
