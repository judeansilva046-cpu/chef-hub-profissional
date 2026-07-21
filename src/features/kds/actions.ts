"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";
import { PAPEIS_COZINHA, PAPEIS_SALA } from "@/server/auth/papeis-acoes";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";

function revalidarKds() {
  revalidatePath("/kds");
  revalidatePath("/expedicao");
  revalidatePath("/pedidos");
}

export async function marcarItemProntoKds(pedidoItemId: string): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA);
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: item, error: erroItem } = await supabase
    .from("pedido_itens")
    .select("id, pedido_id, empresa_id")
    .eq("id", pedidoItemId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (erroItem || !item) throw new Error("Item não encontrado.");

  const { error } = await supabase.rpc("fn_marcar_item_pronto", {
    p_pedido_item_id: pedidoItemId,
  });

  if (error) {
    throw new Error(
      error.message.includes("Item") || error.message.includes("Pedido")
        ? error.message
        : "Não foi possível marcar o item como pronto.",
    );
  }

  void registrarAuditoria({
    acao: "status",
    entidade: "pedido_itens",
    registroId: pedidoItemId,
    valorNovo: { status_preparo: "pronto" },
    metadados: { pedidoId: item.pedido_id, origem: "kds" },
  });

  revalidarKds();
}

export async function expedirPedidoKds(pedidoId: string): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA, ...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: pedido, error: erroPedido } = await supabase
    .from("pedidos")
    .select("id, status, tipo, numero")
    .eq("id", pedidoId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (erroPedido || !pedido) throw new Error("Pedido não encontrado.");

  const { error } = await supabase.rpc("fn_expedir_pedido_kds", {
    p_pedido_id: pedidoId,
  });

  if (error) {
    throw new Error(
      error.message.includes("Pedido") || error.message.includes("Expedição")
        ? error.message
        : "Não foi possível expedir o pedido.",
    );
  }

  void registrarAuditoria({
    acao: "status",
    entidade: "pedidos",
    registroId: pedidoId,
    valorAnterior: { status: pedido.status },
    valorNovo: { status: "saiu_para_entrega" },
    metadados: { origem: "kds", numero: pedido.numero },
  });

  revalidarKds();
}

/** Reimprime o último comprovante de praça/pedido na fila_impressao. */
export async function reimprimirPedidoKds(pedidoId: string): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA, ...PAPEIS_SALA);
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: original, error: erroOriginal } = await supabase
    .from("fila_impressao")
    .select("id, tipo, payload, referencia_tipo, referencia_id")
    .eq("empresa_id", empresa.id)
    .eq("referencia_tipo", "pedido")
    .eq("referencia_id", pedidoId)
    .in("tipo", ["comprovante_praca", "comprovante_pedido", "comprovante_expedicao"])
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (erroOriginal) throw new Error("Não foi possível localizar impressões do pedido.");
  if (!original) throw new Error("Nenhuma impressão encontrada para este pedido.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("fila_impressao").insert({
    empresa_id: empresa.id,
    tipo: original.tipo,
    payload: original.payload,
    referencia_tipo: original.referencia_tipo,
    referencia_id: original.referencia_id,
    criado_por: user?.id,
  });

  if (error) throw new Error("Não foi possível reimprimir.");

  await supabase.rpc("fn_registrar_kds_evento", {
    p_empresa_id: empresa.id,
    p_pedido_id: pedidoId,
    p_evento: "reimpressao",
    p_metadados: { trabalho_original_id: original.id, tipo: original.tipo },
  });

  void registrarAuditoria({
    acao: "criar",
    entidade: "fila_impressao",
    registroId: pedidoId,
    metadados: { origem: "kds_reimpressao", tipo: original.tipo },
  });

  revalidarKds();
}

export async function garantirConfigKds(): Promise<void> {
  await requirePapel(...PAPEIS_COZINHA);
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  await supabase.rpc("fn_seed_kds_config", { p_empresa_id: empresa.id });
}
