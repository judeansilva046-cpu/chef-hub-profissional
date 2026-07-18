import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type ContaPagarParaConciliar = Pick<
  Tables<"contas_pagar">,
  "id" | "descricao" | "valor" | "valor_pago" | "data_pagamento" | "conciliado"
> & {
  fornecedores: Pick<Tables<"fornecedores">, "nome"> | null;
};

/** Contas a pagar já quitadas e ainda não conciliadas — a fila de trabalho da Conciliação Financeira. */
export async function listarContasPagarParaConciliar(): Promise<ContaPagarParaConciliar[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contas_pagar")
    .select("id, descricao, valor, valor_pago, data_pagamento, conciliado, fornecedores(nome)")
    .eq("empresa_id", empresa.id)
    .eq("status", "pago")
    .eq("conciliado", false)
    .order("data_pagamento", { ascending: false });

  if (error) throw error;
  return data as unknown as ContaPagarParaConciliar[];
}

export type ParcelaParaConciliar = Pick<
  Tables<"contas_receber_parcelas">,
  "id" | "numero_parcela" | "valor" | "valor_recebido" | "data_recebimento" | "conciliado"
> & {
  contas_receber: Pick<Tables<"contas_receber">, "descricao"> | null;
};

/** Parcelas já recebidas e ainda não conciliadas. */
export async function listarParcelasParaConciliar(): Promise<ParcelaParaConciliar[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contas_receber_parcelas")
    .select("id, numero_parcela, valor, valor_recebido, data_recebimento, conciliado, contas_receber(descricao)")
    .eq("empresa_id", empresa.id)
    .eq("status", "recebido")
    .eq("conciliado", false)
    .order("data_recebimento", { ascending: false });

  if (error) throw error;
  return data as unknown as ParcelaParaConciliar[];
}
