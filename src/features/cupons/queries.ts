import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type CupomComRelacoes = Tables<"crm_cupons"> & {
  canais_venda: Pick<Tables<"canais_venda">, "id" | "nome"> | null;
  fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome"> | null;
};

export async function listarCupons(): Promise<CupomComRelacoes[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cupons")
    .select("*, canais_venda(id, nome), fichas_tecnicas(id, nome)")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as CupomComRelacoes[];
}

export interface UsoCupomComRelacoes {
  id: string;
  clienteNome: string;
  valorCompra: number;
  valorDesconto: number;
  criadoEm: string;
}

export async function listarUsosCupom(cupomId: string): Promise<UsoCupomComRelacoes[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_cupons_usos")
    .select("id, valor_compra, valor_desconto, criado_em, clientes(nome)")
    .eq("cupom_id", cupomId)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    valor_compra: number;
    valor_desconto: number;
    criado_em: string;
    clientes: { nome: string } | null;
  }>).map((linha) => ({
    id: linha.id,
    clienteNome: linha.clientes?.nome ?? "—",
    valorCompra: linha.valor_compra,
    valorDesconto: linha.valor_desconto,
    criadoEm: linha.criado_em,
  }));
}
