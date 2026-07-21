"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  PAPEIS_CAIXA,
  PAPEIS_COZINHA,
  PAPEIS_SALA,
} from "@/server/auth/papeis-acoes";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";

import {
  adicionalItemSchema,
  cancelamentoPedidoSchema,
  itemPedidoSchema,
  novoPedidoSchema,
  pagamentoPedidoSchema,
  valoresPedidoSchema,
} from "./validation";

function revalidarPedido(id: string) {
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
}

async function assertPedidoDaEmpresa(
  pedidoId: string,
  empresaId: string,
  statusEsperado?: string,
): Promise<{ id: string; status: string; tipo: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, status, tipo")
    .eq("id", pedidoId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error || !data) throw new Error("Pedido não encontrado.");
  if (statusEsperado && data.status !== statusEsperado) {
    throw new Error(`Pedido precisa estar em ${statusEsperado}.`);
  }
  return data;
}

export async function criarPedido(input: unknown): Promise<string> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();

  const validated = novoPedidoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      empresa_id: empresa.id,
      tipo: validated.data.tipo,
      cliente_id: validated.data.clienteId,
      canal_venda_id: validated.data.canalVendaId,
      comanda_id: validated.data.comandaId,
      observacoes: validated.data.observacoes,
      criado_por: user?.id,
    })
    .select("id")
    .single();

  if (error) throw new Error("Não foi possível criar o pedido.");

  revalidatePath("/pedidos");
  return data.id;
}

export async function adicionarItemPedido(pedidoId: string, input: unknown): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const validated = itemPedidoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pedido_itens").insert({
    empresa_id: empresa.id,
    pedido_id: pedidoId,
    ficha_tecnica_id: validated.data.fichaTecnicaId,
    quantidade: validated.data.quantidade,
    preco_unitario_praticado: validated.data.precoUnitarioPraticado,
    desconto_valor: validated.data.descontoValor,
    observacao: validated.data.observacao,
  });

  if (error) throw new Error(error.message || "Não foi possível adicionar o item.");
  revalidarPedido(pedidoId);
}

export async function removerItemPedido(pedidoId: string, itemId: string): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedido_itens")
    .delete()
    .eq("id", itemId)
    .eq("pedido_id", pedidoId)
    .eq("empresa_id", empresa.id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível remover o item.");
  revalidarPedido(pedidoId);
}

export async function atualizarQuantidadeItem(
  pedidoId: string,
  itemId: string,
  quantidade: number,
): Promise<void> {
  if (quantidade <= 0) throw new Error("A quantidade deve ser maior que zero.");

  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedido_itens")
    .update({ quantidade })
    .eq("id", itemId)
    .eq("pedido_id", pedidoId)
    .eq("empresa_id", empresa.id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível atualizar a quantidade.");
  revalidarPedido(pedidoId);
}

export async function adicionarAdicionalItem(
  pedidoId: string,
  pedidoItemId: string,
  input: unknown,
): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const validated = adicionalItemSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pedido_item_adicionais").insert({
    empresa_id: empresa.id,
    pedido_item_id: pedidoItemId,
    ficha_tecnica_id: validated.data.fichaTecnicaId,
    quantidade: validated.data.quantidade,
    preco_unitario_praticado: validated.data.precoUnitarioPraticado,
  });

  if (error) throw new Error(error.message || "Não foi possível adicionar o adicional.");
  revalidarPedido(pedidoId);
}

export async function removerAdicionalItem(pedidoId: string, adicionalId: string): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedido_item_adicionais")
    .delete()
    .eq("id", adicionalId)
    .eq("empresa_id", empresa.id)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível remover o adicional.");
  revalidarPedido(pedidoId);
}

export async function atualizarValoresPedido(pedidoId: string, input: unknown): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const validated = valoresPedidoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .update({
      desconto_percentual: validated.data.descontoPercentual,
      desconto_valor_fixo: validated.data.descontoValorFixo,
      acrescimo_valor: validated.data.acrescimoValor,
      taxa_entrega: validated.data.taxaEntrega,
    })
    .eq("id", pedidoId)
    .eq("empresa_id", empresa.id)
    .eq("status", "rascunho")
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("Não foi possível atualizar os valores do pedido.");
  revalidarPedido(pedidoId);
}

export async function confirmarPedido(pedidoId: string): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id);

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_confirmar_pedido", { p_pedido_id: pedidoId });

  if (error) {
    throw new Error(
      error.message.includes("Estoque insuficiente") || error.message.includes("Pedido")
        ? error.message
        : "Não foi possível confirmar o pedido.",
    );
  }

  revalidarPedido(pedidoId);
  revalidatePath("/kds");
}

export async function iniciarPreparoPedido(pedidoId: string): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id);

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_iniciar_preparo_pedido", { p_pedido_id: pedidoId });

  if (error) {
    throw new Error(
      error.message.includes("Estoque insuficiente") || error.message.includes("Pedido")
        ? error.message
        : "Não foi possível iniciar o preparo.",
    );
  }

  revalidarPedido(pedidoId);
  revalidatePath("/estoque");
  revalidatePath("/kds");
}

export async function avancarStatusPedido(pedidoId: string, statusAtual: string): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA, ...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id);

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_avancar_status_pedido", {
    p_pedido_id: pedidoId,
    p_status_atual: statusAtual,
  });

  if (error) {
    throw new Error(error.message.includes("Status") || error.message.includes("etapa")
      ? error.message
      : "Não foi possível avançar o status do pedido.");
  }

  revalidarPedido(pedidoId);
  revalidatePath("/kds");
  revalidatePath("/expedicao");
}

/** Marca itens de uma praça (ou todos) como prontos no KDS. */
export async function marcarItensProntos(
  pedidoId: string,
  pracaProducaoId?: string | null,
): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id);

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_marcar_itens_pronto", {
    p_pedido_id: pedidoId,
    p_praca_producao_id: pracaProducaoId || undefined,
  });

  if (error) {
    throw new Error(error.message.includes("item") || error.message.includes("Pedido")
      ? error.message
      : "Não foi possível marcar os itens como prontos.");
  }

  revalidarPedido(pedidoId);
  revalidatePath("/kds");
  revalidatePath("/expedicao");
}

export async function concluirPedido(pedidoId: string): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  const pedido = await assertPedidoDaEmpresa(pedidoId, empresa.id);

  if (pedido.tipo === "entrega" || pedido.tipo === "retirada") {
    throw new Error("Pedido tem expedição — conclua pela tela de Expedição.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_concluir_pedido", { p_pedido_id: pedidoId });

  if (error) {
    throw new Error(error.message.includes("Pedido") || error.message.includes("expedição")
      ? error.message
      : "Não foi possível concluir o pedido.");
  }

  revalidarPedido(pedidoId);
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/expedicao");
}

export async function cancelarPedido(pedidoId: string, input: unknown): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id);

  const validated = cancelamentoPedidoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Informe o motivo do cancelamento.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cancelar_pedido", {
    p_pedido_id: pedidoId,
    p_motivo: validated.data.motivo,
  });

  if (error) {
    throw new Error(error.message.includes("Pedido") ? error.message : "Não foi possível cancelar o pedido.");
  }

  revalidarPedido(pedidoId);
  revalidatePath("/estoque");
  revalidatePath("/kds");
  revalidatePath("/expedicao");
}

export async function registrarPagamentoPedido(pedidoId: string, input: unknown): Promise<void> {
  await requirePapel(...PAPEIS_CAIXA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id);

  const validated = pagamentoPedidoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados de pagamento inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_pagamento_pedido", {
    p_pedido_id: pedidoId,
    p_forma_pagamento: validated.data.formaPagamento,
    p_valor: validated.data.valor,
    p_caixa_id: validated.data.caixaId ?? undefined,
    p_troco_para: validated.data.trocoPara ?? undefined,
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) {
    throw new Error(
      error.message.includes("Pedido") ||
        error.message.includes("Pagamento") ||
        error.message.includes("Caixa") ||
        error.message.includes("Troco") ||
        error.message.includes("operador")
        ? error.message
        : "Não foi possível registrar o pagamento.",
    );
  }

  revalidarPedido(pedidoId);
  revalidatePath("/caixa");
}

export async function finalizarVendaPdv(pedidoId: string): Promise<void> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  await assertPedidoDaEmpresa(pedidoId, empresa.id, "rascunho");

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_finalizar_venda_pdv", { p_pedido_id: pedidoId });
  if (error) throw new Error(error.message);

  revalidarPedido(pedidoId);
  revalidatePath("/pdv");
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
}

export async function duplicarPedido(pedidoId: string): Promise<string> {
  await requirePapel(...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();

  const supabase = await createClient();
  const { data: original, error: erroOriginal } = await supabase
    .from("pedidos")
    .select("tipo, cliente_id, canal_venda_id, observacoes")
    .eq("id", pedidoId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (erroOriginal || !original) throw new Error("Pedido original não encontrado.");

  const { data: itensOriginais, error: erroItens } = await supabase
    .from("pedido_itens")
    .select("ficha_tecnica_id, quantidade, preco_unitario_praticado, desconto_valor, observacao, ordem, id")
    .eq("pedido_id", pedidoId)
    .eq("empresa_id", empresa.id);

  if (erroItens) throw new Error("Não foi possível ler os itens do pedido original.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: novoPedido, error: erroNovoPedido } = await supabase
    .from("pedidos")
    .insert({
      empresa_id: empresa.id,
      tipo: original.tipo,
      cliente_id: original.cliente_id,
      canal_venda_id: original.canal_venda_id,
      observacoes: original.observacoes,
      criado_por: user?.id,
    })
    .select("id")
    .single();

  if (erroNovoPedido || !novoPedido) throw new Error("Não foi possível criar o pedido duplicado.");

  if (itensOriginais && itensOriginais.length > 0) {
    const { data: novosItens, error: erroNovosItens } = await supabase
      .from("pedido_itens")
      .insert(
        itensOriginais.map((item) => ({
          empresa_id: empresa.id,
          pedido_id: novoPedido.id,
          ficha_tecnica_id: item.ficha_tecnica_id,
          quantidade: item.quantidade,
          preco_unitario_praticado: item.preco_unitario_praticado,
          desconto_valor: item.desconto_valor,
          observacao: item.observacao,
          ordem: item.ordem,
        })),
      )
      .select("id, ficha_tecnica_id");

    if (erroNovosItens) throw new Error("Não foi possível copiar os itens do pedido.");

    const { data: adicionaisOriginais } = await supabase
      .from("pedido_item_adicionais")
      .select("pedido_item_id, ficha_tecnica_id, quantidade, preco_unitario_praticado")
      .in(
        "pedido_item_id",
        itensOriginais.map((item) => item.id),
      );

    if (adicionaisOriginais && adicionaisOriginais.length > 0 && novosItens) {
      const mapaItens = new Map(itensOriginais.map((item, index) => [item.id, novosItens[index]?.id]));

      const novosAdicionais = adicionaisOriginais
        .map((adicional) => ({
          empresa_id: empresa.id,
          pedido_item_id: mapaItens.get(adicional.pedido_item_id),
          ficha_tecnica_id: adicional.ficha_tecnica_id,
          quantidade: adicional.quantidade,
          preco_unitario_praticado: adicional.preco_unitario_praticado,
        }))
        .filter((adicional): adicional is typeof adicional & { pedido_item_id: string } =>
          Boolean(adicional.pedido_item_id),
        );

      if (novosAdicionais.length > 0) {
        await supabase.from("pedido_item_adicionais").insert(novosAdicionais);
      }
    }
  }

  revalidatePath("/pedidos");
  return novoPedido.id;
}
