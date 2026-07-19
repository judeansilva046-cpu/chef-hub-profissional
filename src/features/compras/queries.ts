import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { verifySession } from "@/server/auth/dal";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from "@/types/pagination";

export interface ListarSolicitacoesParams {
  status?: string;
  page?: number;
}

export type SolicitacaoComCentroCusto = Tables<"solicitacoes_compra"> & {
  centros_custo: Pick<Tables<"centros_custo">, "id" | "nome"> | null;
};

export async function listarSolicitacoesCompra({
  status = "todos",
  page = 1,
}: ListarSolicitacoesParams): Promise<
  PaginatedResult<SolicitacaoComCentroCusto>
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("solicitacoes_compra")
    .select("*, centros_custo(id, nome)", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as SolicitacaoComCentroCusto[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type SolicitacaoItemComIngrediente = Tables<"solicitacoes_compra_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export type SolicitacaoCompleta = Tables<"solicitacoes_compra"> & {
  centros_custo: Pick<Tables<"centros_custo">, "id" | "nome"> | null;
  solicitacoes_compra_itens: SolicitacaoItemComIngrediente[];
};

export async function buscarSolicitacaoPorId(
  id: string,
): Promise<SolicitacaoCompleta | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitacoes_compra")
    .select(
      `*,
      centros_custo(id, nome),
      solicitacoes_compra_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla))
      )`,
    )
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as SolicitacaoCompleta;
}

export type SolicitacaoHistoricoItem = Tables<"solicitacoes_compra_historico"> & {
  profiles: Pick<Tables<"profiles">, "nome_completo"> | null;
};

export async function listarHistoricoSolicitacao(
  solicitacaoId: string,
): Promise<SolicitacaoHistoricoItem[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitacoes_compra_historico")
    .select("*, profiles(nome_completo)")
    .eq("solicitacao_id", solicitacaoId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SolicitacaoHistoricoItem[];
}

export type SolicitacaoAprovacaoItem = Tables<"solicitacoes_compra_aprovacoes"> & {
  profiles: Pick<Tables<"profiles">, "nome_completo"> | null;
};

export async function listarAprovacoesSolicitacao(
  solicitacaoId: string,
): Promise<SolicitacaoAprovacaoItem[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitacoes_compra_aprovacoes")
    .select("*, profiles(nome_completo)")
    .eq("solicitacao_id", solicitacaoId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SolicitacaoAprovacaoItem[];
}

export async function podeAprovarSolicitacao(
  solicitacaoId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_pode_aprovar_solicitacao", {
    p_solicitacao_id: solicitacaoId,
  });

  if (error) return false;
  return data ?? false;
}

export interface ListarPedidosParams {
  status?: string;
  page?: number;
}

export type PedidoComFornecedor = Tables<"pedidos_compra"> & {
  fornecedores: Pick<Tables<"fornecedores">, "id" | "nome">;
};

export async function listarPedidosCompra({
  status = "todos",
  page = 1,
}: ListarPedidosParams): Promise<PaginatedResult<PedidoComFornecedor>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("pedidos_compra")
    .select("*, fornecedores(id, nome)", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as unknown as PedidoComFornecedor[],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export type PedidoItemComIngrediente = Tables<"pedidos_compra_itens"> & {
  ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export type PedidoCompleto = Tables<"pedidos_compra"> & {
  fornecedores: Pick<Tables<"fornecedores">, "id" | "nome">;
  centros_custo: Pick<Tables<"centros_custo">, "id" | "nome"> | null;
  plano_contas: Pick<Tables<"plano_contas">, "id" | "nome"> | null;
  solicitacoes_compra: Pick<Tables<"solicitacoes_compra">, "id" | "numero"> | null;
  compras_cotacoes: Pick<Tables<"compras_cotacoes">, "id" | "numero"> | null;
  pedidos_compra_itens: PedidoItemComIngrediente[];
};

export async function buscarPedidoPorId(
  id: string,
): Promise<PedidoCompleto | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select(
      `*,
      fornecedores(id, nome),
      centros_custo(id, nome),
      plano_contas(id, nome),
      solicitacoes_compra(id, numero),
      compras_cotacoes!pedidos_compra_cotacao_origem_id_fkey(id, numero),
      pedidos_compra_itens(
        *,
        ingredientes(id, nome, unidades_medida(sigla))
      )`,
    )
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as unknown as PedidoCompleto;
}

export type PedidoHistoricoItem = Tables<"pedidos_compra_historico"> & {
  profiles: Pick<Tables<"profiles">, "nome_completo"> | null;
};

export async function listarHistoricoPedido(
  pedidoId: string,
): Promise<PedidoHistoricoItem[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos_compra_historico")
    .select("*, profiles(nome_completo)")
    .eq("pedido_id", pedidoId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as PedidoHistoricoItem[];
}

export type RecebimentoComItens = Tables<"compras_recebimentos"> & {
  profiles: Pick<Tables<"profiles">, "nome_completo"> | null;
  compras_recebimentos_itens: Array<
    Tables<"compras_recebimentos_itens"> & {
      pedidos_compra_itens: { ingredientes: Pick<Tables<"ingredientes">, "nome"> };
    }
  >;
};

export async function listarRecebimentosPedido(
  pedidoId: string,
): Promise<RecebimentoComItens[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_recebimentos")
    .select(
      `*,
      profiles(nome_completo),
      compras_recebimentos_itens(
        *,
        pedidos_compra_itens(ingredientes(nome))
      )`,
    )
    .eq("pedido_id", pedidoId)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as RecebimentoComItens[];
}

export interface PrecoFornecedorItem {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  precoUnitario: number;
  precoAnterior: number | null;
  atualizadoEm: string;
  codigoFornecedor: string | null;
  unidadeCompraId: string | null;
  unidadeCompraSigla: string | null;
  fatorConversao: number;
  marca: string | null;
  embalagem: string | null;
  quantidadeEmbalagem: number;
  prazoEntregaDias: number | null;
  pedidoMinimo: number | null;
  preferencial: boolean;
}

export interface ComparativoPrecoIngrediente {
  ingredienteId: string;
  ingredienteNome: string;
  unidadeSigla: string;
  precoMedio: number | null;
  precos: PrecoFornecedorItem[];
}

export async function listarComparativoPrecos({
  busca,
}: { busca?: string } = {}): Promise<ComparativoPrecoIngrediente[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let query = supabase
    .from("ingredientes")
    .select(
      `id, nome, unidades_medida(sigla),
      fornecedor_ingredientes(
        id, fornecedor_id, preco_unitario, preco_anterior, atualizado_em,
        codigo_fornecedor, unidade_compra_id, fator_conversao, marca,
        embalagem, quantidade_embalagem, prazo_entrega_dias, pedido_minimo,
        preferencial,
        fornecedores(nome),
        unidades_medida:unidade_compra_id(sigla)
      )`,
    )
    .eq("empresa_id", empresa.id)
    .eq("ativo", true);

  if (busca) {
    query = query.ilike("nome", `%${busca}%`);
  }

  const { data, error } = await query.order("nome", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    nome: string;
    unidades_medida: { sigla: string };
    fornecedor_ingredientes: Array<{
      id: string;
      fornecedor_id: string;
      preco_unitario: number;
      preco_anterior: number | null;
      atualizado_em: string;
      codigo_fornecedor: string | null;
      unidade_compra_id: string | null;
      fator_conversao: number;
      marca: string | null;
      embalagem: string | null;
      quantidade_embalagem: number;
      prazo_entrega_dias: number | null;
      pedido_minimo: number | null;
      preferencial: boolean;
      fornecedores: { nome: string };
      unidades_medida: { sigla: string } | null;
    }>;
  }>).map((row) => {
    const precos = row.fornecedor_ingredientes
      .map((preco) => ({
        id: preco.id,
        fornecedorId: preco.fornecedor_id,
        fornecedorNome: preco.fornecedores.nome,
        precoUnitario: preco.preco_unitario,
        precoAnterior: preco.preco_anterior,
        atualizadoEm: preco.atualizado_em,
        codigoFornecedor: preco.codigo_fornecedor,
        unidadeCompraId: preco.unidade_compra_id,
        unidadeCompraSigla: preco.unidades_medida?.sigla ?? null,
        fatorConversao: preco.fator_conversao,
        marca: preco.marca,
        embalagem: preco.embalagem,
        quantidadeEmbalagem: preco.quantidade_embalagem,
        prazoEntregaDias: preco.prazo_entrega_dias,
        pedidoMinimo: preco.pedido_minimo,
        preferencial: preco.preferencial,
      }))
      .sort((a, b) => a.precoUnitario - b.precoUnitario);

    return {
      ingredienteId: row.id,
      ingredienteNome: row.nome,
      unidadeSigla: row.unidades_medida.sigla,
      precoMedio:
        precos.length > 0
          ? precos.reduce((soma, item) => soma + item.precoUnitario, 0) /
            precos.length
          : null,
      precos,
    };
  });
}

export type NivelAprovacaoComCentroCusto = Tables<"compras_niveis_aprovacao"> & {
  centros_custo: Pick<Tables<"centros_custo">, "id" | "nome"> | null;
};

export async function listarNiveisAprovacao(): Promise<NivelAprovacaoComCentroCusto[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_niveis_aprovacao")
    .select("*, centros_custo(id, nome)")
    .eq("empresa_id", empresa.id)
    .order("ordem", { ascending: true })
    .order("valor_minimo", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as NivelAprovacaoComCentroCusto[];
}

export interface AprovadorDisponivel {
  usuarioId: string;
  nome: string;
}

/**
 * Usuários que podem ser escolhidos como aprovador específico numa faixa —
 * membros ativos da empresa com perfil visível via fn_perfis_visiveis_compras
 * (mesmo motivo de listarAprovacoesSolicitacao: profiles só tem policy de
 * select own).
 */
export async function listarAprovadoresDisponiveis(): Promise<AprovadorDisponivel[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const [{ data: membros, error: membrosError }, { data: perfis, error: perfisError }] =
    await Promise.all([
      supabase
        .from("usuarios_empresa")
        .select("usuario_id")
        .eq("empresa_id", empresa.id)
        .eq("ativo", true),
      supabase.rpc("fn_perfis_visiveis_compras", { p_empresa_id: empresa.id }),
    ]);

  if (membrosError) throw membrosError;
  if (perfisError) throw perfisError;

  const perfisPorId = new Map((perfis ?? []).map((perfil) => [perfil.id, perfil]));

  return (membros ?? [])
    .map((membro) => perfisPorId.get(membro.usuario_id))
    .filter((perfil): perfil is NonNullable<typeof perfil> => Boolean(perfil))
    .map((perfil) => ({
      usuarioId: perfil.id,
      nome: perfil.nome_completo || perfil.email || perfil.id,
    }));
}

export interface ListarCotacoesParams {
  status?: string;
  page?: number;
}

export async function listarCotacoes({
  status = "todos",
  page = 1,
}: ListarCotacoesParams): Promise<PaginatedResult<Tables<"compras_cotacoes">>> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { data: [], page: 1, perPage: DEFAULT_PAGE_SIZE, totalCount: 0, totalPages: 0 };
  }

  const supabase = await createClient();
  const currentPage = Math.max(1, page);
  const from = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const to = from + DEFAULT_PAGE_SIZE - 1;

  let query = supabase
    .from("compras_cotacoes")
    .select("*", { count: "exact" })
    .eq("empresa_id", empresa.id);

  if (status !== "todos") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const totalCount = count ?? 0;

  return {
    data: data ?? [],
    page: currentPage,
    perPage: DEFAULT_PAGE_SIZE,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE)),
  };
}

export interface CotacaoItemDetalhe {
  id: string;
  ingredienteId: string;
  ingredienteNome: string;
  unidadeSigla: string;
  quantidade: number;
}

export interface CotacaoPropostaItemDetalhe {
  id: string;
  cotacaoItemId: string;
  precoUnitario: number;
  atendePedidoMinimo: boolean;
}

export interface CotacaoFornecedorDetalhe {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  status: string;
  prazoEntregaDias: number | null;
  condicaoPagamento: string | null;
  valorFrete: number;
  valorImpostos: number;
  pedidoMinimo: number | null;
  observacao: string | null;
  respondidoEm: string | null;
  propostas: CotacaoPropostaItemDetalhe[];
  itensRespondidos: number;
  totalItens: number;
  totalGeral: number;
}

export interface CotacaoCompleta {
  id: string;
  numero: number | null;
  status: string;
  observacao: string | null;
  criadoEm: string;
  finalizadoEm: string | null;
  fornecedorVencedorId: string | null;
  escolhaAutomatica: boolean;
  justificativaEscolha: string | null;
  solicitacaoOrigem: { id: string; numero: number | null } | null;
  itens: CotacaoItemDetalhe[];
  fornecedores: CotacaoFornecedorDetalhe[];
}

export async function buscarCotacaoPorId(id: string): Promise<CotacaoCompleta | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_cotacoes")
    .select(
      `*,
      solicitacoes_compra(id, numero),
      compras_cotacoes_itens(
        id, ingrediente_id, quantidade,
        ingredientes(id, nome, unidades_medida(sigla))
      ),
      compras_cotacoes_fornecedores(
        id, fornecedor_id, status, prazo_entrega_dias, condicao_pagamento,
        valor_frete, valor_impostos, pedido_minimo, observacao, respondido_em,
        fornecedores(id, nome),
        compras_cotacoes_propostas_itens(id, cotacao_item_id, preco_unitario, atende_pedido_minimo)
      )`,
    )
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as unknown as {
    id: string;
    numero: number | null;
    status: string;
    observacao: string | null;
    criado_em: string;
    finalizado_em: string | null;
    fornecedor_vencedor_id: string | null;
    escolha_automatica: boolean;
    justificativa_escolha: string | null;
    solicitacoes_compra: { id: string; numero: number | null } | null;
    compras_cotacoes_itens: Array<{
      id: string;
      ingrediente_id: string;
      quantidade: number;
      ingredientes: { id: string; nome: string; unidades_medida: { sigla: string } };
    }>;
    compras_cotacoes_fornecedores: Array<{
      id: string;
      fornecedor_id: string;
      status: string;
      prazo_entrega_dias: number | null;
      condicao_pagamento: string | null;
      valor_frete: number;
      valor_impostos: number;
      pedido_minimo: number | null;
      observacao: string | null;
      respondido_em: string | null;
      fornecedores: { id: string; nome: string };
      compras_cotacoes_propostas_itens: Array<{
        id: string;
        cotacao_item_id: string;
        preco_unitario: number;
        atende_pedido_minimo: boolean;
      }>;
    }>;
  };

  const itens: CotacaoItemDetalhe[] = raw.compras_cotacoes_itens.map((item) => ({
    id: item.id,
    ingredienteId: item.ingrediente_id,
    ingredienteNome: item.ingredientes.nome,
    unidadeSigla: item.ingredientes.unidades_medida.sigla,
    quantidade: item.quantidade,
  }));

  const quantidadePorItem = new Map(itens.map((item) => [item.id, item.quantidade]));

  const fornecedores: CotacaoFornecedorDetalhe[] = raw.compras_cotacoes_fornecedores.map(
    (cf) => {
      const propostas = cf.compras_cotacoes_propostas_itens.map((p) => ({
        id: p.id,
        cotacaoItemId: p.cotacao_item_id,
        precoUnitario: p.preco_unitario,
        atendePedidoMinimo: p.atende_pedido_minimo,
      }));
      const totalItens = propostas.reduce(
        (soma, p) => soma + p.precoUnitario * (quantidadePorItem.get(p.cotacaoItemId) ?? 0),
        0,
      );

      return {
        id: cf.id,
        fornecedorId: cf.fornecedor_id,
        fornecedorNome: cf.fornecedores.nome,
        status: cf.status,
        prazoEntregaDias: cf.prazo_entrega_dias,
        condicaoPagamento: cf.condicao_pagamento,
        valorFrete: cf.valor_frete,
        valorImpostos: cf.valor_impostos,
        pedidoMinimo: cf.pedido_minimo,
        observacao: cf.observacao,
        respondidoEm: cf.respondido_em,
        propostas,
        itensRespondidos: propostas.length,
        totalItens,
        totalGeral: totalItens + cf.valor_frete + cf.valor_impostos,
      };
    },
  );

  return {
    id: raw.id,
    numero: raw.numero,
    status: raw.status,
    observacao: raw.observacao,
    criadoEm: raw.criado_em,
    finalizadoEm: raw.finalizado_em,
    fornecedorVencedorId: raw.fornecedor_vencedor_id,
    escolhaAutomatica: raw.escolha_automatica,
    justificativaEscolha: raw.justificativa_escolha,
    solicitacaoOrigem: raw.solicitacoes_compra,
    itens,
    fornecedores,
  };
}

export type SolicitacaoParaCotacao = Tables<"solicitacoes_compra"> & {
  solicitacoes_compra_itens: Array<
    Pick<Tables<"solicitacoes_compra_itens">, "id" | "ingrediente_id" | "quantidade"> & {
      ingredientes: Pick<Tables<"ingredientes">, "id" | "nome"> & {
        unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
      };
    }
  >;
};

/**
 * Só solicitações aprovadas e ainda não convertidas — mesma regra do
 * fluxo manual (converterSolicitacaoEmPedido), aqui usada para pré-preencher
 * os itens de uma nova cotação.
 */
export async function listarSolicitacoesAprovadasParaCotacao(): Promise<
  SolicitacaoParaCotacao[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitacoes_compra")
    .select(
      `*,
      solicitacoes_compra_itens(id, ingrediente_id, quantidade, ingredientes(id, nome, unidades_medida(sigla)))`,
    )
    .eq("empresa_id", empresa.id)
    .eq("status", "aprovada")
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SolicitacaoParaCotacao[];
}

/**
 * Notificações são pessoais (usuario_id = auth.uid(), 0057) — não filtram
 * por empresa_id porque a policy RLS já é por dono da linha, não por
 * empresa; mesmo assim incluímos empresa_id explicitamente para não misturar
 * notificações de outra empresa do mesmo usuário.
 */
export async function listarNotificacoesCompras(): Promise<
  Tables<"compras_notificacoes">[]
> {
  const { user } = await verifySession();
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras_notificacoes")
    .select("*")
    .eq("usuario_id", user.id)
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function contarNotificacoesNaoLidasCompras(): Promise<number> {
  const { user } = await verifySession();
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("compras_notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id)
    .eq("empresa_id", empresa.id)
    .eq("lida", false);

  if (error) return 0;
  return count ?? 0;
}
