"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";

import {
  ajusteEstoqueSchema,
  entradaEstoqueSchema,
  novoInventarioSchema,
  saidaEstoqueSchema,
} from "./validation";

export interface EstoqueActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidarEstoque() {
  revalidatePath("/estoque");
  revalidatePath("/estoque/movimentacoes");
  revalidatePath("/estoque/lotes");
}

export async function registrarEntradaEstoque(
  _prevState: EstoqueActionState | undefined,
  formData: FormData,
): Promise<EstoqueActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = entradaEstoqueSchema.safeParse({
    ingredienteId: formData.get("ingredienteId"),
    quantidade: formData.get("quantidade"),
    custoUnitario: formData.get("custoUnitario"),
    numeroLote: formData.get("numeroLote"),
    dataValidade: formData.get("dataValidade"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_entrada_estoque", {
    p_ingrediente_id: validated.data.ingredienteId,
    p_quantidade: validated.data.quantidade,
    p_custo_unitario: validated.data.custoUnitario,
    p_numero_lote: validated.data.numeroLote ?? undefined,
    p_data_validade: validated.data.dataValidade ?? undefined,
    p_referencia_tipo: "manual",
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) {
    return { formError: error.message };
  }

  revalidarEstoque();
  return { success: true };
}

export async function registrarSaidaEstoque(
  _prevState: EstoqueActionState | undefined,
  formData: FormData,
): Promise<EstoqueActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = saidaEstoqueSchema.safeParse({
    ingredienteId: formData.get("ingredienteId"),
    quantidade: formData.get("quantidade"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_saida_estoque", {
    p_ingrediente_id: validated.data.ingredienteId,
    p_quantidade: validated.data.quantidade,
    p_tipo: "saida",
    p_referencia_tipo: "manual",
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) {
    return {
      formError:
        error.message.includes("Estoque insuficiente")
          ? error.message
          : "Não foi possível registrar a saída.",
    };
  }

  revalidarEstoque();
  return { success: true };
}

export async function registrarAjusteEstoque(
  _prevState: EstoqueActionState | undefined,
  formData: FormData,
): Promise<EstoqueActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = ajusteEstoqueSchema.safeParse({
    ingredienteId: formData.get("ingredienteId"),
    direcao: formData.get("direcao"),
    quantidade: formData.get("quantidade"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (validated.data.direcao === "entrada") {
    const { data: ingrediente, error: ingredienteError } = await supabase
      .from("ingredientes")
      .select("custo_unitario_atual")
      .eq("id", validated.data.ingredienteId)
      .maybeSingle();

    if (ingredienteError || !ingrediente) {
      return { formError: "Ingrediente não encontrado." };
    }

    const { error } = await supabase.rpc("fn_registrar_entrada_estoque", {
      p_ingrediente_id: validated.data.ingredienteId,
      p_quantidade: validated.data.quantidade,
      p_custo_unitario: ingrediente.custo_unitario_atual,
      p_referencia_tipo: "ajuste",
      p_observacao: validated.data.observacao,
    });

    if (error) {
      return { formError: "Não foi possível registrar o ajuste." };
    }
  } else {
    const { error } = await supabase.rpc("fn_registrar_saida_estoque", {
      p_ingrediente_id: validated.data.ingredienteId,
      p_quantidade: validated.data.quantidade,
      p_tipo: "ajuste_saida",
      p_referencia_tipo: "ajuste",
      p_observacao: validated.data.observacao,
    });

    if (error) {
      return {
        formError: error.message.includes("Estoque insuficiente")
          ? error.message
          : "Não foi possível registrar o ajuste.",
      };
    }
  }

  revalidarEstoque();
  return { success: true };
}

/**
 * Cria o inventário e captura o saldo atual de cada ingrediente ativo como
 * quantidade_sistema — snapshot imutável do momento da contagem, usado por
 * fn_concluir_inventario para calcular a diferença. Invocada diretamente
 * pelo client (não via <form action>) porque precisa devolver o id para
 * navegação — mesmo padrão de duplicarFichaTecnica.
 */
export async function criarInventario(nome: string): Promise<string> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const validated = novoInventarioSchema.safeParse({ nome });
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();

  const { data: inventario, error: inventarioError } = await supabase
    .from("estoque_inventarios")
    .insert({ empresa_id: empresa.id, nome: validated.data.nome })
    .select("id")
    .single();

  if (inventarioError) {
    throw new Error("Não foi possível criar o inventário.");
  }

  const { data: ingredientes, error: ingredientesError } = await supabase
    .from("ingredientes")
    .select("id, estoque_saldos(quantidade_total)")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true);

  if (ingredientesError) {
    throw new Error("Não foi possível carregar os ingredientes.");
  }

  const itens = ((ingredientes ?? []) as unknown as Array<{
    id: string;
    estoque_saldos: { quantidade_total: number }[] | { quantidade_total: number } | null;
  }>).map((ingrediente) => {
    const saldo = Array.isArray(ingrediente.estoque_saldos)
      ? ingrediente.estoque_saldos[0]
      : ingrediente.estoque_saldos;
    return {
      inventario_id: inventario.id,
      ingrediente_id: ingrediente.id,
      quantidade_sistema: saldo?.quantidade_total ?? 0,
    };
  });

  if (itens.length > 0) {
    const { error: itensError } = await supabase
      .from("estoque_inventario_itens")
      .insert(itens);

    if (itensError) {
      throw new Error("Não foi possível preparar os itens do inventário.");
    }
  }

  revalidatePath("/estoque/inventarios");
  return inventario.id;
}

export async function salvarContagemInventario(
  inventarioId: string,
  itens: { itemId: string; quantidadeContada: number | null }[],
): Promise<void> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: inventario, error: inventarioError } = await supabase
    .from("estoque_inventarios")
    .select("id")
    .eq("id", inventarioId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (inventarioError || !inventario) {
    throw new Error("Inventário não encontrado.");
  }

  // estoque_inventario_itens não tem empresa_id — amarra pelo inventario_id
  // já verificado acima.
  const results = await Promise.all(
    itens.map((item) =>
      supabase
        .from("estoque_inventario_itens")
        .update({ quantidade_contada: item.quantidadeContada })
        .eq("id", item.itemId)
        .eq("inventario_id", inventarioId),
    ),
  );

  if (results.some((result) => result.error)) {
    throw new Error("Não foi possível salvar a contagem.");
  }

  revalidatePath(`/estoque/inventarios/${inventarioId}`);
}

/**
 * Conclui o inventário via RPC (fn_concluir_inventario, migration 0015):
 * gera entradas/saídas de ajuste para cada diferença contada e marca o
 * inventário como concluído.
 */
export async function concluirInventario(inventarioId: string): Promise<void> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: inventario, error: inventarioError } = await supabase
    .from("estoque_inventarios")
    .select("id")
    .eq("id", inventarioId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (inventarioError || !inventario) {
    throw new Error("Inventário não encontrado.");
  }

  const { error } = await supabase.rpc("fn_concluir_inventario", {
    p_inventario_id: inventarioId,
  });

  if (error) {
    throw new Error("Não foi possível concluir o inventário.");
  }

  revalidarEstoque();
  revalidatePath(`/estoque/inventarios/${inventarioId}`);
  revalidatePath("/estoque/inventarios");
}
