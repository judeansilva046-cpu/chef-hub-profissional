import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export type PedidoComRelacoes = Tables<"pedidos"> & {
  clientes: Pick<Tables<"clientes">, "id" | "nome"> | null;
  canais_venda: Pick<Tables<"canais_venda">, "id" | "nome"> | null;
};

export interface ListarPedidosParams {
  status?: string;
  tipo?: string;
  busca?: string;
  page?: number;
}

const SELECT_PEDIDO_COM_RELACOES = "*, clientes(id, nome), canais_venda(id, nome)";

export async function listarPedidos({
  status,
  tipo,
  busca,
  page = 1,
}: ListarPedidosParams): Promise<PaginatedResult<PedidoComRelacoes>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("pedidos")
    .select(SELECT_PEDIDO_COM_RELACOES, { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status) query = query.eq("status", status);
  if (tipo) query = query.eq("tipo", tipo);
  if (busca) {
    const numero = Number.parseInt(busca, 10);
    if (Number.isInteger(numero)) {
      query = query.eq("numero", numero);
    }
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as PedidoComRelacoes[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type PedidoItemComFicha = Tables<"pedido_itens"> & {
  fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome">;
  pedido_item_adicionais: (Tables<"pedido_item_adicionais"> & {
    fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome">;
  })[];
};

export interface PedidoDetalhado {
  pedido: PedidoComRelacoes;
  itens: PedidoItemComFicha[];
  pagamentos: Tables<"pagamentos">[];
  historico: Tables<"pedido_status_historico">[];
}

export async function buscarPedidoDetalhado(id: string): Promise<PedidoDetalhado | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();

  const [{ data: pedido, error: erroPedido }, { data: itens, error: erroItens }, { data: pagamentos, error: erroPagamentos }, { data: historico, error: erroHistorico }] =
    await Promise.all([
      supabase
        .from("pedidos")
        .select(SELECT_PEDIDO_COM_RELACOES)
        .eq("id", id)
        .eq("empresa_id", empresa.id)
        .maybeSingle(),
      supabase
        .from("pedido_itens")
        .select("*, fichas_tecnicas(id, nome), pedido_item_adicionais(*, fichas_tecnicas(id, nome))")
        .eq("pedido_id", id)
        .order("ordem", { ascending: true }),
      supabase
        .from("pagamentos")
        .select("*")
        .eq("pedido_id", id)
        .order("criado_em", { ascending: true }),
      supabase
        .from("pedido_status_historico")
        .select("*")
        .eq("pedido_id", id)
        .order("criado_em", { ascending: true }),
    ]);

  if (erroPedido) throw erroPedido;
  if (!pedido) return null;
  if (erroItens) throw erroItens;
  if (erroPagamentos) throw erroPagamentos;
  if (erroHistorico) throw erroHistorico;

  return {
    pedido: pedido as unknown as PedidoComRelacoes,
    itens: (itens ?? []) as unknown as PedidoItemComFicha[],
    pagamentos: pagamentos ?? [],
    historico: historico ?? [],
  };
}

export type FichaTecnicaParaPedido = Pick<
  Tables<"fichas_tecnicas">,
  "id" | "nome" | "custo_por_porcao" | "preco_venda_praticado" | "preco_sugerido" | "disponivel_como_adicional"
>;

/** Fichas técnicas ativas para o seletor de itens do pedido/PDV — mesma fonte de preço/custo já calculada pelo módulo de Ficha Técnica (nenhuma duplicação de precificação). */
export async function listarFichasTecnicasParaPedido(): Promise<FichaTecnicaParaPedido[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas")
    .select("id, nome, custo_por_porcao, preco_venda_praticado, preco_sugerido, disponivel_como_adicional")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}

