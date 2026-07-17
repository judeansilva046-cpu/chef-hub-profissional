"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { categoriaIngredienteSchema } from "./validation";

export interface CategoriaIngredienteActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseCategoriaForm(formData: FormData) {
  return categoriaIngredienteSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
  });
}

export async function criarCategoriaIngrediente(
  _prevState: CategoriaIngredienteActionState | undefined,
  formData: FormData,
): Promise<CategoriaIngredienteActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseCategoriaForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categorias_ingredientes").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    descricao: validated.data.descricao || null,
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe uma categoria com esse nome."
          : "Não foi possível salvar a categoria.",
    };
  }

  revalidatePath("/categorias");
  return { success: true };
}

export async function atualizarCategoriaIngrediente(
  id: string,
  _prevState: CategoriaIngredienteActionState | undefined,
  formData: FormData,
): Promise<CategoriaIngredienteActionState> {
  const validated = parseCategoriaForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_ingredientes")
    .update({
      nome: validated.data.nome,
      descricao: validated.data.descricao || null,
    })
    .eq("id", id);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe uma categoria com esse nome."
          : "Não foi possível salvar a categoria.",
    };
  }

  revalidatePath("/categorias");
  return { success: true };
}

export async function excluirCategoriaIngrediente(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_ingredientes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível excluir a categoria.");
  }

  revalidatePath("/categorias");
}
