import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type PedidoParaKds = Pick<
  Tables<"pedidos">,
  "id" | "numero" | "tipo" | "status" | "confirmado_em" | "criado_em" | "observacoes"
> & {
  pedido_itens: (Pick<Tables<"pedido_itens">, "id" | "quantidade" | "observacao"> & {
    fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome" | "praca_producao_id">;
  })[];
};

/** Pedidos ainda não concluídos que já entraram no fluxo de produção (confirmado/em_preparo/pronto) — reaproveita pedidos+pedido_itens, nenhuma tabela nova para o KDS. */
export async function listarPedidosParaKds(): Promise<PedidoParaKds[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select(
      "id, numero, tipo, status, confirmado_em, criado_em, observacoes, pedido_itens(id, quantidade, observacao, fichas_tecnicas(id, nome, praca_producao_id))",
    )
    .eq("empresa_id", empresa.id)
    .in("status", ["confirmado", "em_preparo", "pronto"])
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return data as unknown as PedidoParaKds[];
}

export async function listarPracasProducao(): Promise<Tables<"pracas_producao">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pracas_producao")
    .select("*")
    .or(`empresa_id.eq.${empresa.id},empresa_id.is.null`)
    .eq("ativo", true)
    .order("ordem_exibicao", { ascending: true });

  if (error) throw error;
  return data;
}
