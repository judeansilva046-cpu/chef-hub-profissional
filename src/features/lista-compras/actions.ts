"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export interface GerarListaInput {
  nome: string;
  dataInicio: string;
  dataFim: string;
}

/**
 * Gera a lista via fn_gerar_lista_compras (migration 0019): soma o consumo
 * previsto (produções planejadas × itens da ficha) no período, mais a
 * reposição de segurança de ingredientes já abaixo do mínimo, e sugere o
 * fornecedor de menor preço conhecido para cada item.
 */
export async function gerarListaCompras(
  input: GerarListaInput,
): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const nome = input.nome.trim();
  if (!nome) {
    throw new Error("Informe um nome para a lista.");
  }
  if (!input.dataInicio || !input.dataFim) {
    throw new Error("Informe o período de referência.");
  }
  if (input.dataFim < input.dataInicio) {
    throw new Error("A data final deve ser igual ou posterior à inicial.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_gerar_lista_compras", {
    p_empresa_id: empresa.id,
    p_nome: nome,
    p_data_inicio: input.dataInicio,
    p_data_fim: input.dataFim,
  });

  if (error) {
    throw new Error("Não foi possível gerar a lista de compras.");
  }

  revalidatePath("/lista-compras");
  return data;
}

export interface SalvarItemListaInput {
  itemId: string;
  fornecedorId: string | null;
  quantidadeSugerida: number;
  precoUnitarioPrevisto: number;
}

export async function salvarItensLista(
  listaId: string,
  itens: SalvarItemListaInput[],
): Promise<void> {
  if (itens.some((item) => item.quantidadeSugerida <= 0)) {
    throw new Error("A quantidade sugerida deve ser maior que zero.");
  }
  if (itens.some((item) => item.precoUnitarioPrevisto < 0)) {
    throw new Error("O preço previsto não pode ser negativo.");
  }

  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: lista, error: listaError } = await supabase
    .from("listas_compra")
    .select("id")
    .eq("id", listaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (listaError || !lista) {
    throw new Error("Lista de compras não encontrada.");
  }

  // listas_compra_itens não tem empresa_id — amarra pelo lista_id verificado.
  const results = await Promise.all(
    itens.map((item) =>
      supabase
        .from("listas_compra_itens")
        .update({
          fornecedor_id: item.fornecedorId,
          quantidade_sugerida: item.quantidadeSugerida,
          preco_unitario_previsto: item.precoUnitarioPrevisto,
        })
        .eq("id", item.itemId)
        .eq("lista_id", listaId),
    ),
  );

  if (results.some((result) => result.error)) {
    throw new Error("Não foi possível salvar as alterações.");
  }

  revalidatePath(`/lista-compras/${listaId}`);
}

/**
 * Converte a lista em um pedido de compra (rascunho) por fornecedor via
 * fn_converter_lista_em_pedidos (migration 0019). A função falha se algum
 * item ainda não tiver fornecedor definido.
 */
export async function converterListaEmPedidos(
  listaId: string,
): Promise<string[]> {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: lista, error: listaError } = await supabase
    .from("listas_compra")
    .select("id")
    .eq("id", listaId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (listaError || !lista) {
    throw new Error("Lista de compras não encontrada.");
  }

  const { data, error } = await supabase.rpc("fn_converter_lista_em_pedidos", {
    p_lista_id: listaId,
  });

  if (error) {
    throw new Error(
      error.message.includes("sem fornecedor")
        ? error.message
        : "Não foi possível converter a lista em pedidos.",
    );
  }

  revalidatePath(`/lista-compras/${listaId}`);
  revalidatePath("/lista-compras");
  revalidatePath("/compras/pedidos");
  return data;
}
