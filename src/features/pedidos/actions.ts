"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

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

/**
 * Não redireciona: chamada direta de um Client Component (formulário de
 * "novo pedido"), fora de <form action>. Mesmo motivo de
 * duplicarFichaTecnica — redirect() dentro de uma função assim seria
 * capturado como erro comum pelo try/catch do chamador. Quem chama navega
 * via useRouter() com o id retornado.
 */
export async function criarPedido(input: unknown): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

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
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

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

  if (error) throw new Error("Não foi possível adicionar o item.");
  revalidarPedido(pedidoId);
}

export async function removerItemPedido(pedidoId: string, itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pedido_itens").delete().eq("id", itemId);

  if (error) throw new Error("Não foi possível remover o item.");
  revalidarPedido(pedidoId);
}

export async function atualizarQuantidadeItem(
  pedidoId: string,
  itemId: string,
  quantidade: number,
): Promise<void> {
  if (quantidade <= 0) throw new Error("A quantidade deve ser maior que zero.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedido_itens")
    .update({ quantidade })
    .eq("id", itemId);

  if (error) throw new Error("Não foi possível atualizar a quantidade.");
  revalidarPedido(pedidoId);
}

export async function adicionarAdicionalItem(
  pedidoId: string,
  pedidoItemId: string,
  input: unknown,
): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

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

  if (error) throw new Error("Não foi possível adicionar o adicional.");
  revalidarPedido(pedidoId);
}

export async function removerAdicionalItem(pedidoId: string, adicionalId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("pedido_item_adicionais").delete().eq("id", adicionalId);

  if (error) throw new Error("Não foi possível remover o adicional.");
  revalidarPedido(pedidoId);
}

export async function atualizarValoresPedido(pedidoId: string, input: unknown): Promise<void> {
  const validated = valoresPedidoSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({
      desconto_percentual: validated.data.descontoPercentual,
      desconto_valor_fixo: validated.data.descontoValorFixo,
      acrescimo_valor: validated.data.acrescimoValor,
      taxa_entrega: validated.data.taxaEntrega,
    })
    .eq("id", pedidoId);

  if (error) throw new Error("Não foi possível atualizar os valores do pedido.");
  revalidarPedido(pedidoId);
}

/**
 * Confirma o pedido: reserva/valida estoque (fn_confirmar_pedido, 0033) —
 * mensagem de "estoque insuficiente" é repassada ao usuário tal como o
 * banco a formula (mesmo padrão de concluirProducao em
 * src/features/producao/actions.ts).
 */
export async function confirmarPedido(pedidoId: string): Promise<void> {
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

/** Inicia o preparo: consome o estoque via FIFO (fn_iniciar_preparo_pedido, 0033). */
export async function iniciarPreparoPedido(pedidoId: string): Promise<void> {
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

const PROXIMOS_STATUS_SIMPLES: Record<string, string> = {
  em_preparo: "pronto",
  pronto: "saiu_para_entrega",
};

/**
 * Transições sem efeito colateral em estoque/vendas (em_preparo -> pronto,
 * pronto -> saiu_para_entrega): update direto, sem RPC — mesmo padrão de
 * atualizarStatusProducao em src/features/producao/actions.ts. Valida a
 * transição contra o status atual para não permitir pular etapas.
 */
export async function avancarStatusPedido(pedidoId: string, statusAtual: string): Promise<void> {
  const proximoStatus = PROXIMOS_STATUS_SIMPLES[statusAtual];
  if (!proximoStatus) {
    throw new Error("Não há próxima etapa simples para este status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ status: proximoStatus })
    .eq("id", pedidoId)
    .eq("status", statusAtual);

  if (error) throw new Error("Não foi possível avançar o status do pedido.");
  revalidarPedido(pedidoId);
  revalidatePath("/kds");
  revalidatePath("/expedicao");
}

/** Conclui o pedido (entregue) e cria as vendas reais (fn_concluir_pedido, 0033). */
export async function concluirPedido(pedidoId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_concluir_pedido", { p_pedido_id: pedidoId });

  if (error) {
    throw new Error(error.message.includes("Pedido") ? error.message : "Não foi possível concluir o pedido.");
  }

  revalidarPedido(pedidoId);
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/expedicao");
}

/** Cancela o pedido, estornando estoque já consumido quando aplicável (fn_cancelar_pedido, 0033). */
export async function cancelarPedido(pedidoId: string, input: unknown): Promise<void> {
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
    throw new Error(error.message.includes("Pedido") ? error.message : "Não foi possível registrar o pagamento.");
  }

  revalidarPedido(pedidoId);
  revalidatePath("/caixa");
}

/**
 * Checkout do PDV: encadeia confirmar -> iniciar preparo -> pronto ->
 * concluir num único round-trip a partir do cliente. Não introduz nenhuma
 * lógica nova de negócio — só chama, em sequência, exatamente as mesmas
 * quatro funções que a tela /pedidos/[id] chama uma a uma. Usado quando a
 * venda de balcão é consumida/entregue na hora (sem passar por KDS/
 * expedição em telas separadas).
 */
export async function finalizarVendaPdv(pedidoId: string): Promise<void> {
  const supabase = await createClient();

  const passos = [
    { fn: "fn_confirmar_pedido", args: { p_pedido_id: pedidoId } },
    { fn: "fn_iniciar_preparo_pedido", args: { p_pedido_id: pedidoId } },
  ] as const;

  for (const passo of passos) {
    const { error } = await supabase.rpc(passo.fn, passo.args);
    if (error) throw new Error(error.message);
  }

  const { error: erroAvancar } = await supabase
    .from("pedidos")
    .update({ status: "pronto" })
    .eq("id", pedidoId)
    .eq("status", "em_preparo");
  if (erroAvancar) throw new Error("Não foi possível avançar o pedido para pronto.");

  const { error: erroConcluir } = await supabase.rpc("fn_concluir_pedido", { p_pedido_id: pedidoId });
  if (erroConcluir) throw new Error(erroConcluir.message);

  revalidarPedido(pedidoId);
  revalidatePath("/pdv");
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath("/estoque");
}

/**
 * Duplica um pedido (itens + adicionais) como um novo rascunho — não
 * reaproveita fn_duplicar_ficha_tecnica (é de outro domínio), mas segue o
 * mesmo princípio: recriar como registro novo, deixando as triggers de
 * snapshot/recalculo recalcularem tudo do zero (custo/preço atualizados no
 * momento da duplicação, não congelados do pedido original).
 */
export async function duplicarPedido(pedidoId: string): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { data: original, error: erroOriginal } = await supabase
    .from("pedidos")
    .select("tipo, cliente_id, canal_venda_id, observacoes")
    .eq("id", pedidoId)
    .single();

  if (erroOriginal || !original) throw new Error("Pedido original não encontrado.");

  const { data: itensOriginais, error: erroItens } = await supabase
    .from("pedido_itens")
    .select("ficha_tecnica_id, quantidade, preco_unitario_praticado, desconto_valor, observacao, ordem, id")
    .eq("pedido_id", pedidoId);

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
      .in("pedido_item_id", itensOriginais.map((item) => item.id));

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
