"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";

import { ingredienteSchema } from "./validation";

export interface IngredienteActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseIngredienteForm(formData: FormData) {
  return ingredienteSchema.safeParse({
    nome: formData.get("nome"),
    categoriaId: formData.get("categoriaId"),
    unidadeMedidaId: formData.get("unidadeMedidaId"),
    custoUnitarioAtual: formData.get("custoUnitarioAtual"),
    estoqueMinimo: formData.get("estoqueMinimo"),
  });
}

export async function criarIngrediente(
  _prevState: IngredienteActionState | undefined,
  formData: FormData,
): Promise<IngredienteActionState> {
  await requirePapel();
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseIngredienteForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredientes").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    categoria_id: validated.data.categoriaId,
    unidade_medida_id: validated.data.unidadeMedidaId,
    custo_unitario_atual: validated.data.custoUnitarioAtual,
    estoque_minimo: validated.data.estoqueMinimo,
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe um ingrediente com esse nome."
          : "Não foi possível salvar o ingrediente.",
    };
  }

  revalidatePath("/ingredientes");
  return { success: true };
}

export async function atualizarIngrediente(
  id: string,
  _prevState: IngredienteActionState | undefined,
  formData: FormData,
): Promise<IngredienteActionState> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();

  const validated = parseIngredienteForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // Alterar custo_unitario_atual aqui dispara automaticamente a trigger que
  // grava uma nova linha em ingredientes_historico_precos — não duplicar
  // essa gravação aqui (ver supabase/migrations/0007).
  const { error } = await supabase
    .from("ingredientes")
    .update({
      nome: validated.data.nome,
      categoria_id: validated.data.categoriaId,
      unidade_medida_id: validated.data.unidadeMedidaId,
      custo_unitario_atual: validated.data.custoUnitarioAtual,
      estoque_minimo: validated.data.estoqueMinimo,
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe um ingrediente com esse nome."
          : "Não foi possível salvar o ingrediente.",
    };
  }

  revalidatePath("/ingredientes");
  return { success: true };
}

export async function alternarAtivoIngrediente(id: string, ativo: boolean) {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredientes")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error("Não foi possível atualizar o ingrediente.");
  }

  revalidatePath("/ingredientes");
}
