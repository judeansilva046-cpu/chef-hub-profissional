"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/server/auth/dal";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import {
  cotacaoSchema,
  nivelAprovacaoSchema,
  pedidoCompraSchema,
  precoFornecedorSchema,
  propostaFornecedorSchema,
  registrarRecebimentoItemSchema,
  solicitacaoCompraSchema,
} from "./validation";

export interface CriarSolicitacaoInput {
  observacao: string | null;
  setor: string | null;
  centroCustoId: string | null;
  prioridade: string;
  justificativa: string | null;
  dataNecessaria: string | null;
  itens: {
    ingredienteId: string;
    quantidade: number | null;
    precoEstimado: number | null;
  }[];
}

/**
 * Invocada diretamente pelo client (lista de itens dinâmica, mesmo padrão de
 * salvarFichaTecnica) — cria a solicitação e seus itens numa sequência de
 * duas gravações (sem RPC dedicada: diferente de estoque/produção, não há
 * efeito colateral em outras tabelas a proteger com atomicidade forte aqui).
 */
export async function criarSolicitacaoCompra(
  input: CriarSolicitacaoInput,
): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const validated = solicitacaoCompraSchema.safeParse({
    observacao: input.observacao?.trim() || null,
    setor: input.setor?.trim() || null,
    centroCustoId: input.centroCustoId || null,
    prioridade: input.prioridade || "normal",
    justificativa: input.justificativa?.trim() || null,
    dataNecessaria: input.dataNecessaria?.trim() || null,
    itens: input.itens,
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes_compra")
    .insert({
      empresa_id: empresa.id,
      observacao: validated.data.observacao,
      setor: validated.data.setor,
      centro_custo_id: validated.data.centroCustoId,
      prioridade: validated.data.prioridade,
      justificativa: validated.data.justificativa,
      data_necessaria: validated.data.dataNecessaria,
    })
    .select("id")
    .single();

  if (solicitacaoError) {
    throw new Error("Não foi possível criar a solicitação de compra.");
  }

  const { error: itensError } = await supabase
    .from("solicitacoes_compra_itens")
    .insert(
      validated.data.itens.map((item) => ({
        solicitacao_id: solicitacao.id,
        ingrediente_id: item.ingredienteId,
        quantidade: item.quantidade,
        preco_estimado: item.precoEstimado ?? 0,
      })),
    );

  if (itensError) {
    throw new Error("Não foi possível salvar os itens da solicitação.");
  }

  revalidatePath("/compras/solicitacoes");
  return solicitacao.id;
}

/**
 * As 3 decisões de aprovação (0057) passam sempre pelas funções RPC
 * dedicadas — não por um UPDATE direto — porque são elas que gravam o log em
 * solicitacoes_compra_aprovacoes, validam quem pode decidir
 * (fn_pode_aprovar_solicitacao) e disparam a notificação para quem criou a
 * solicitação.
 */
export async function aprovarSolicitacaoCompra(
  id: string,
  comentario?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_aprovar_solicitacao_compra", {
    p_solicitacao_id: id,
    p_comentario: comentario?.trim() || undefined,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível aprovar a solicitação.");
  }

  revalidatePath("/compras/solicitacoes");
  revalidatePath(`/compras/solicitacoes/${id}`);
}

export async function rejeitarSolicitacaoCompra(
  id: string,
  motivo: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_rejeitar_solicitacao_compra", {
    p_solicitacao_id: id,
    p_motivo: motivo.trim(),
  });

  if (error) {
    throw new Error(error.message || "Não foi possível rejeitar a solicitação.");
  }

  revalidatePath("/compras/solicitacoes");
  revalidatePath(`/compras/solicitacoes/${id}`);
}

export async function solicitarAjusteSolicitacaoCompra(
  id: string,
  comentario: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_solicitar_ajuste_solicitacao_compra", {
    p_solicitacao_id: id,
    p_comentario: comentario.trim(),
  });

  if (error) {
    throw new Error(error.message || "Não foi possível solicitar o ajuste.");
  }

  revalidatePath("/compras/solicitacoes");
  revalidatePath(`/compras/solicitacoes/${id}`);
}

/**
 * Converte todos os itens de uma solicitação aprovada num único pedido de
 * compra (rascunho) para o fornecedor escolhido, usando o preço da lista de
 * preços do fornecedor quando disponível (0 caso contrário, editável depois
 * na tela do pedido). Simplificação deliberada: uma solicitação vira um
 * pedido para UM fornecedor — sourcing multi-fornecedor automático já existe
 * como fluxo dedicado na Lista Inteligente de Compras.
 */
export async function converterSolicitacaoEmPedido(
  solicitacaoId: string,
  fornecedorId: string,
): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const supabase = await createClient();

  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes_compra")
    .select("status, solicitacoes_compra_itens(ingrediente_id, quantidade)")
    .eq("id", solicitacaoId)
    .maybeSingle();

  if (solicitacaoError || !solicitacao) {
    throw new Error("Solicitação não encontrada.");
  }
  if (solicitacao.status !== "aprovada") {
    throw new Error(
      "Apenas solicitações aprovadas podem ser convertidas em pedido.",
    );
  }

  const ingredienteIds = solicitacao.solicitacoes_compra_itens.map(
    (item) => item.ingrediente_id,
  );

  const { data: precos } = await supabase
    .from("fornecedor_ingredientes")
    .select("ingrediente_id, preco_unitario")
    .eq("fornecedor_id", fornecedorId)
    .in("ingrediente_id", ingredienteIds);

  const precoPorIngrediente = new Map(
    (precos ?? []).map((preco) => [preco.ingrediente_id, preco.preco_unitario]),
  );

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos_compra")
    .insert({
      empresa_id: empresa.id,
      fornecedor_id: fornecedorId,
      solicitacao_origem_id: solicitacaoId,
    })
    .select("id")
    .single();

  if (pedidoError) {
    throw new Error("Não foi possível criar o pedido de compra.");
  }

  const { error: itensError } = await supabase
    .from("pedidos_compra_itens")
    .insert(
      solicitacao.solicitacoes_compra_itens.map((item) => ({
        pedido_id: pedido.id,
        ingrediente_id: item.ingrediente_id,
        quantidade_pedida: item.quantidade,
        preco_unitario: precoPorIngrediente.get(item.ingrediente_id) ?? 0,
      })),
    );

  if (itensError) {
    throw new Error("Não foi possível salvar os itens do pedido.");
  }

  await supabase
    .from("solicitacoes_compra")
    .update({ status: "convertida" })
    .eq("id", solicitacaoId);

  revalidatePath("/compras/solicitacoes");
  revalidatePath(`/compras/solicitacoes/${solicitacaoId}`);
  revalidatePath("/compras/pedidos");
  return pedido.id;
}

export interface CriarPedidoInput {
  fornecedorId: string;
  dataPrevistaEntrega: string | null;
  observacao: string | null;
  centroCustoId: string | null;
  planoContaId: string | null;
  descontoPercentual: number | null;
  descontoValorFixo: number | null;
  valorFrete: number | null;
  valorImpostos: number | null;
  condicaoPagamento: string | null;
  numeroParcelas: number | null;
  itens: {
    ingredienteId: string;
    quantidade: number | null;
    precoUnitario: number | null;
  }[];
}

export async function criarPedidoCompra(
  input: CriarPedidoInput,
): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const validated = pedidoCompraSchema.safeParse({
    fornecedorId: input.fornecedorId,
    dataPrevistaEntrega: input.dataPrevistaEntrega?.trim() || null,
    observacao: input.observacao?.trim() || null,
    solicitacaoOrigemId: null,
    centroCustoId: input.centroCustoId || null,
    planoContaId: input.planoContaId || null,
    descontoPercentual: input.descontoPercentual ?? 0,
    descontoValorFixo: input.descontoValorFixo ?? 0,
    valorFrete: input.valorFrete ?? 0,
    valorImpostos: input.valorImpostos ?? 0,
    condicaoPagamento: input.condicaoPagamento?.trim() || null,
    numeroParcelas: input.numeroParcelas ?? 1,
    itens: input.itens,
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos_compra")
    .insert({
      empresa_id: empresa.id,
      fornecedor_id: validated.data.fornecedorId,
      data_prevista_entrega: validated.data.dataPrevistaEntrega,
      observacao: validated.data.observacao,
      centro_custo_id: validated.data.centroCustoId,
      plano_conta_id: validated.data.planoContaId,
      desconto_percentual: validated.data.descontoPercentual,
      desconto_valor_fixo: validated.data.descontoValorFixo,
      valor_frete: validated.data.valorFrete,
      valor_impostos: validated.data.valorImpostos,
      condicao_pagamento: validated.data.condicaoPagamento,
      numero_parcelas: validated.data.numeroParcelas,
    })
    .select("id")
    .single();

  if (pedidoError) {
    throw new Error("Não foi possível criar o pedido de compra.");
  }

  const { error: itensError } = await supabase
    .from("pedidos_compra_itens")
    .insert(
      validated.data.itens.map((item) => ({
        pedido_id: pedido.id,
        ingrediente_id: item.ingredienteId,
        quantidade_pedida: item.quantidade,
        preco_unitario: item.precoUnitario,
      })),
    );

  if (itensError) {
    throw new Error("Não foi possível salvar os itens do pedido.");
  }

  revalidatePath("/compras/pedidos");
  return pedido.id;
}

export async function atualizarStatusPedido(
  id: string,
  status: "aguardando_aprovacao" | "enviado" | "cancelado",
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos_compra")
    .update({ status })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar o pedido.");
  }

  revalidatePath("/compras/pedidos");
  revalidatePath(`/compras/pedidos/${id}`);
}

export async function aprovarPedidoCompra(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_aprovar_pedido_compra", {
    p_pedido_id: id,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível aprovar o pedido.");
  }

  revalidatePath("/compras/pedidos");
  revalidatePath(`/compras/pedidos/${id}`);
}

export interface RegistrarRecebimentoItemInput {
  pedidoItemId: string;
  quantidadeRecebida: number | null;
  quantidadeRecusada: number | null;
  precoConferido: number | null;
  numeroLote: string | null;
  dataFabricacao: string | null;
  dataValidade: string | null;
  motivoDivergencia: string | null;
}

/**
 * Registra o recebimento (ou recusa) de um item via o único caminho de
 * escrita fn_registrar_recebimento_item (migration 0061): cria/reaproveita o
 * cabeçalho compras_recebimentos, aciona fn_receber_item_pedido_compra /
 * fn_registrar_recusa_item_pedido_compra (lote FIFO / recusa), grava a linha
 * de conferência e notifica em caso de divergência — tudo no banco.
 */
export async function registrarRecebimentoItem(
  pedidoId: string,
  input: RegistrarRecebimentoItemInput,
): Promise<void> {
  const validated = registrarRecebimentoItemSchema.safeParse({
    pedidoItemId: input.pedidoItemId,
    quantidadeRecebida: input.quantidadeRecebida ?? 0,
    quantidadeRecusada: input.quantidadeRecusada ?? 0,
    precoConferido: input.precoConferido,
    numeroLote: input.numeroLote?.trim() || null,
    dataFabricacao: input.dataFabricacao?.trim() || null,
    dataValidade: input.dataValidade?.trim() || null,
    motivoDivergencia: input.motivoDivergencia?.trim() || null,
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_recebimento_item", {
    p_pedido_item_id: validated.data.pedidoItemId,
    p_quantidade_recebida: validated.data.quantidadeRecebida,
    p_quantidade_recusada: validated.data.quantidadeRecusada,
    p_preco_conferido: validated.data.precoConferido ?? undefined,
    p_numero_lote: validated.data.numeroLote ?? undefined,
    p_data_fabricacao: validated.data.dataFabricacao ?? undefined,
    p_data_validade: validated.data.dataValidade ?? undefined,
    p_motivo_divergencia: validated.data.motivoDivergencia ?? undefined,
  });

  if (error) {
    throw new Error(
      error.message.includes("excede") || error.message.includes("Informe")
        ? error.message
        : "Não foi possível registrar o recebimento.",
    );
  }

  revalidatePath(`/compras/pedidos/${pedidoId}`);
  revalidatePath("/compras/pedidos");
  revalidatePath("/estoque");
  revalidatePath("/estoque/movimentacoes");
  revalidatePath("/estoque/lotes");
}

export interface PrecoFornecedorActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function salvarPrecoFornecedor(
  _prevState: PrecoFornecedorActionState | undefined,
  formData: FormData,
): Promise<PrecoFornecedorActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = precoFornecedorSchema.safeParse({
    ingredienteId: formData.get("ingredienteId"),
    fornecedorId: formData.get("fornecedorId"),
    precoUnitario: formData.get("precoUnitario"),
    codigoFornecedor: formData.get("codigoFornecedor"),
    unidadeCompraId: formData.get("unidadeCompraId"),
    fatorConversao: formData.get("fatorConversao"),
    marca: formData.get("marca"),
    embalagem: formData.get("embalagem"),
    quantidadeEmbalagem: formData.get("quantidadeEmbalagem"),
    prazoEntregaDias: formData.get("prazoEntregaDias"),
    pedidoMinimo: formData.get("pedidoMinimo"),
    preferencial: formData.get("preferencial"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (validated.data.preferencial) {
    await supabase
      .from("fornecedor_ingredientes")
      .update({ preferencial: false })
      .eq("empresa_id", empresa.id)
      .eq("ingrediente_id", validated.data.ingredienteId)
      .neq("fornecedor_id", validated.data.fornecedorId);
  }

  const { error } = await supabase.from("fornecedor_ingredientes").upsert(
    {
      empresa_id: empresa.id,
      ingrediente_id: validated.data.ingredienteId,
      fornecedor_id: validated.data.fornecedorId,
      preco_unitario: validated.data.precoUnitario,
      codigo_fornecedor: validated.data.codigoFornecedor,
      unidade_compra_id: validated.data.unidadeCompraId,
      fator_conversao: validated.data.fatorConversao,
      marca: validated.data.marca,
      embalagem: validated.data.embalagem,
      quantidade_embalagem: validated.data.quantidadeEmbalagem,
      prazo_entrega_dias: validated.data.prazoEntregaDias,
      pedido_minimo: validated.data.pedidoMinimo,
      preferencial: validated.data.preferencial,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "fornecedor_id,ingrediente_id" },
  );

  if (error) {
    return { formError: "Não foi possível salvar o preço." };
  }

  revalidatePath("/compras/precos");
  return { success: true };
}

export async function removerPrecoFornecedor(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedor_ingredientes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível remover o preço.");
  }

  revalidatePath("/compras/precos");
}

export interface NivelAprovacaoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function salvarNivelAprovacao(
  id: string | undefined,
  _prevState: NivelAprovacaoActionState | undefined,
  formData: FormData,
): Promise<NivelAprovacaoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = nivelAprovacaoSchema.safeParse({
    nome: formData.get("nome"),
    valorMinimo: formData.get("valorMinimo"),
    valorMaximo: formData.get("valorMaximo"),
    centroCustoId: formData.get("centroCustoId"),
    papelAprovador: formData.get("papelAprovador"),
    usuarioAprovadorId: formData.get("usuarioAprovadorId"),
    ordem: formData.get("ordem"),
    ativo: formData.get("ativo"),
  });

  if (!validated.success) {
    const flat = validated.error.flatten().fieldErrors as Record<
      string,
      string[] | undefined
    >;
    return { fieldErrors: flat, formError: flat.papelAprovador?.[0] };
  }

  const colunas = {
    empresa_id: empresa.id,
    nome: validated.data.nome,
    valor_minimo: validated.data.valorMinimo,
    valor_maximo: validated.data.valorMaximo,
    centro_custo_id: validated.data.centroCustoId,
    papel_aprovador: validated.data.papelAprovador,
    usuario_aprovador_id: validated.data.usuarioAprovadorId,
    ordem: validated.data.ordem,
    ativo: validated.data.ativo,
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("compras_niveis_aprovacao").update(colunas).eq("id", id).eq("empresa_id", empresa.id)
    : await supabase.from("compras_niveis_aprovacao").insert(colunas);

  if (error) {
    return { formError: "Não foi possível salvar a faixa de aprovação." };
  }

  revalidatePath("/compras/aprovacao");
  return { success: true };
}

export async function removerNivelAprovacao(id: string): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_niveis_aprovacao")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível remover a faixa de aprovação.");
  }

  revalidatePath("/compras/aprovacao");
}

export async function alternarAtivoNivelAprovacao(
  id: string,
  ativo: boolean,
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_niveis_aprovacao")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar a faixa de aprovação.");
  }

  revalidatePath("/compras/aprovacao");
}

export interface CriarCotacaoInput {
  solicitacaoOrigemId: string | null;
  observacao: string | null;
  itens: { ingredienteId: string; quantidade: number | null }[];
  fornecedorIds: string[];
}

export async function criarCotacao(input: CriarCotacaoInput): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const validated = cotacaoSchema.safeParse({
    solicitacaoOrigemId: input.solicitacaoOrigemId,
    observacao: input.observacao?.trim() || null,
    itens: input.itens,
    fornecedorIds: input.fornecedorIds,
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data: cotacao, error: cotacaoError } = await supabase
    .from("compras_cotacoes")
    .insert({
      empresa_id: empresa.id,
      solicitacao_origem_id: validated.data.solicitacaoOrigemId,
      observacao: validated.data.observacao,
    })
    .select("id")
    .single();

  if (cotacaoError) {
    throw new Error("Não foi possível criar a cotação.");
  }

  const { error: itensError } = await supabase.from("compras_cotacoes_itens").insert(
    validated.data.itens.map((item) => ({
      empresa_id: empresa.id,
      cotacao_id: cotacao.id,
      ingrediente_id: item.ingredienteId,
      quantidade: item.quantidade,
    })),
  );

  if (itensError) {
    throw new Error("Não foi possível salvar os itens da cotação.");
  }

  const { error: fornecedoresError } = await supabase
    .from("compras_cotacoes_fornecedores")
    .insert(
      validated.data.fornecedorIds.map((fornecedorId) => ({
        empresa_id: empresa.id,
        cotacao_id: cotacao.id,
        fornecedor_id: fornecedorId,
      })),
    );

  if (fornecedoresError) {
    throw new Error("Não foi possível convidar os fornecedores.");
  }

  revalidatePath("/compras/cotacoes");
  return cotacao.id;
}

export async function atualizarStatusCotacao(
  id: string,
  status: "em_andamento" | "cancelada",
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_cotacoes")
    .update({ status })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar a cotação.");
  }

  revalidatePath("/compras/cotacoes");
  revalidatePath(`/compras/cotacoes/${id}`);
}

export async function convidarFornecedorCotacao(
  cotacaoId: string,
  fornecedorId: string,
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase.from("compras_cotacoes_fornecedores").insert({
    empresa_id: empresa.id,
    cotacao_id: cotacaoId,
    fornecedor_id: fornecedorId,
  });

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Este fornecedor já foi convidado."
        : "Não foi possível convidar o fornecedor.",
    );
  }

  revalidatePath(`/compras/cotacoes/${cotacaoId}`);
}

export async function removerFornecedorCotacao(
  cotacaoFornecedorId: string,
  cotacaoId: string,
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_cotacoes_fornecedores")
    .delete()
    .eq("id", cotacaoFornecedorId)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível remover o fornecedor da cotação.");
  }

  revalidatePath(`/compras/cotacoes/${cotacaoId}`);
}

export interface RegistrarPropostaInput {
  cotacaoId: string;
  cotacaoFornecedorId: string;
  prazoEntregaDias: number | null;
  condicaoPagamento: string | null;
  valorFrete: number | null;
  valorImpostos: number | null;
  pedidoMinimo: number | null;
  observacao: string | null;
  itens: { cotacaoItemId: string; precoUnitario: number | null; atendePedidoMinimo: boolean }[];
}

export async function registrarPropostaFornecedor(
  input: RegistrarPropostaInput,
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const validated = propostaFornecedorSchema.safeParse({
    prazoEntregaDias: input.prazoEntregaDias,
    condicaoPagamento: input.condicaoPagamento,
    valorFrete: input.valorFrete ?? 0,
    valorImpostos: input.valorImpostos ?? 0,
    pedidoMinimo: input.pedidoMinimo,
    observacao: input.observacao,
    itens: input.itens.map((item) => ({
      cotacaoItemId: item.cotacaoItemId,
      precoUnitario: item.precoUnitario ?? 0,
      atendePedidoMinimo: item.atendePedidoMinimo,
    })),
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();

  const { error: cotacaoFornecedorError } = await supabase
    .from("compras_cotacoes_fornecedores")
    .update({
      status: "respondido",
      prazo_entrega_dias: validated.data.prazoEntregaDias,
      condicao_pagamento: validated.data.condicaoPagamento,
      valor_frete: validated.data.valorFrete,
      valor_impostos: validated.data.valorImpostos,
      pedido_minimo: validated.data.pedidoMinimo,
      observacao: validated.data.observacao,
      respondido_em: new Date().toISOString(),
    })
    .eq("id", input.cotacaoFornecedorId)
    .eq("empresa_id", empresa.id);

  if (cotacaoFornecedorError) {
    throw new Error("Não foi possível registrar a proposta.");
  }

  if (validated.data.itens.length > 0) {
    const { error: itensError } = await supabase
      .from("compras_cotacoes_propostas_itens")
      .upsert(
        validated.data.itens.map((item) => ({
          empresa_id: empresa.id,
          cotacao_fornecedor_id: input.cotacaoFornecedorId,
          cotacao_item_id: item.cotacaoItemId,
          preco_unitario: item.precoUnitario,
          atende_pedido_minimo: item.atendePedidoMinimo,
        })),
        { onConflict: "cotacao_fornecedor_id,cotacao_item_id" },
      );

    if (itensError) {
      throw new Error("Não foi possível registrar os preços propostos.");
    }
  }

  await supabase
    .from("compras_cotacoes")
    .update({ status: "em_andamento" })
    .eq("id", input.cotacaoId)
    .eq("empresa_id", empresa.id)
    .eq("status", "aberta");

  revalidatePath(`/compras/cotacoes/${input.cotacaoId}`);
}

export async function escolherMelhorPropostaCotacao(
  cotacaoId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_escolher_melhor_proposta_cotacao", {
    p_cotacao_id: cotacaoId,
  });

  if (error) return null;
  return data ?? null;
}

export async function finalizarCotacao(
  cotacaoId: string,
  fornecedorVencedorId: string,
  justificativa: string | null,
  escolhaAutomatica: boolean,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_finalizar_cotacao", {
    p_cotacao_id: cotacaoId,
    p_fornecedor_vencedor_id: fornecedorVencedorId,
    p_justificativa: justificativa?.trim() || undefined,
    p_escolha_automatica: escolhaAutomatica,
  });

  if (error) {
    throw new Error(error.message || "Não foi possível finalizar a cotação.");
  }

  revalidatePath("/compras/cotacoes");
  revalidatePath(`/compras/cotacoes/${cotacaoId}`);
  revalidatePath("/compras/pedidos");
  revalidatePath("/compras/solicitacoes");
  return data as string;
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_notificacoes")
    .update({ lida: true })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível marcar a notificação como lida.");
  }

  revalidatePath("/compras", "layout");
}

export async function marcarTodasNotificacoesLidas(): Promise<void> {
  const { user } = await verifySession();
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_notificacoes")
    .update({ lida: true })
    .eq("usuario_id", user.id)
    .eq("empresa_id", empresa.id)
    .eq("lida", false);

  if (error) {
    throw new Error("Não foi possível marcar as notificações como lidas.");
  }

  revalidatePath("/compras", "layout");
}
