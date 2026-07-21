"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import {
  pedidoCompraSchema,
  precoFornecedorSchema,
  receberItemPedidoSchema,
  solicitacaoCompraSchema,
} from "./validation";

export interface CriarSolicitacaoInput {
  observacao: string | null;
  itens: { ingredienteId: string; quantidade: number | null }[];
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
    itens: input.itens,
  });

  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes_compra")
    .insert({ empresa_id: empresa.id, observacao: validated.data.observacao })
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
      })),
    );

  if (itensError) {
    throw new Error("Não foi possível salvar os itens da solicitação.");
  }

  revalidatePath("/compras/solicitacoes");
  return solicitacao.id;
}

export async function atualizarStatusSolicitacao(
  id: string,
  status: "aprovada" | "rejeitada",
): Promise<void> {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("solicitacoes_compra")
    .update({ status })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar a solicitação.");
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
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: solicitacao, error: solicitacaoError } = await supabase
    .from("solicitacoes_compra")
    .select("status, solicitacoes_compra_itens(ingrediente_id, quantidade)")
    .eq("id", solicitacaoId)
    .eq("empresa_id", empresa.id)
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
    .eq("id", solicitacaoId)
    .eq("empresa_id", empresa.id);

  revalidatePath("/compras/solicitacoes");
  revalidatePath(`/compras/solicitacoes/${solicitacaoId}`);
  revalidatePath("/compras/pedidos");
  return pedido.id;
}

export interface CriarPedidoInput {
  fornecedorId: string;
  dataPrevistaEntrega: string | null;
  observacao: string | null;
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
  status: "enviado" | "cancelado",
): Promise<void> {
  const empresa = await requireEmpresaAtual();
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

export interface ReceberItemActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

/**
 * Registra o recebimento via fn_receber_item_pedido_compra (migration 0017):
 * cria o lote de estoque (FIFO) e atualiza quantidade_recebida/status do
 * pedido, tudo no banco.
 */
export async function receberItemPedido(
  pedidoId: string,
  _prevState: ReceberItemActionState | undefined,
  formData: FormData,
): Promise<ReceberItemActionState> {
  const empresa = await requireEmpresaAtual();

  const validated = receberItemPedidoSchema.safeParse({
    pedidoItemId: formData.get("pedidoItemId"),
    quantidade: formData.get("quantidade"),
    numeroLote: formData.get("numeroLote"),
    dataValidade: formData.get("dataValidade"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos_compra")
    .select("id")
    .eq("id", pedidoId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (pedidoError || !pedido) {
    return { formError: "Pedido de compra não encontrado." };
  }

  const { error } = await supabase.rpc("fn_receber_item_pedido_compra", {
    p_pedido_item_id: validated.data.pedidoItemId,
    p_quantidade: validated.data.quantidade,
    p_numero_lote: validated.data.numeroLote ?? undefined,
    p_data_validade: validated.data.dataValidade ?? undefined,
  });

  if (error) {
    return {
      formError: error.message.includes("excede")
        ? error.message
        : "Não foi possível registrar o recebimento.",
    };
  }

  revalidatePath(`/compras/pedidos/${pedidoId}`);
  revalidatePath("/compras/pedidos");
  revalidatePath("/estoque");
  revalidatePath("/estoque/movimentacoes");
  revalidatePath("/estoque/lotes");
  return { success: true };
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
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fornecedor_ingredientes").upsert(
    {
      empresa_id: empresa.id,
      ingrediente_id: validated.data.ingredienteId,
      fornecedor_id: validated.data.fornecedorId,
      preco_unitario: validated.data.precoUnitario,
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
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedor_ingredientes")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível remover o preço.");
  }

  revalidatePath("/compras/precos");
}
