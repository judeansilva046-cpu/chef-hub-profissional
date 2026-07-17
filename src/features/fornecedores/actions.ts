"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { fornecedorSchema } from "./validation";

export interface FornecedorActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseFornecedorForm(formData: FormData) {
  return fornecedorSchema.safeParse({
    nome: formData.get("nome"),
    documento: formData.get("documento"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    endereco: formData.get("endereco"),
    observacoes: formData.get("observacoes"),
  });
}

export async function criarFornecedor(
  _prevState: FornecedorActionState | undefined,
  formData: FormData,
): Promise<FornecedorActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseFornecedorForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fornecedores").insert({
    empresa_id: empresa.id,
    ...validated.data,
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe um fornecedor com esse nome."
          : "Não foi possível salvar o fornecedor.",
    };
  }

  revalidatePath("/compras/fornecedores");
  return { success: true };
}

export async function atualizarFornecedor(
  id: string,
  _prevState: FornecedorActionState | undefined,
  formData: FormData,
): Promise<FornecedorActionState> {
  const validated = parseFornecedorForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update(validated.data)
    .eq("id", id);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe um fornecedor com esse nome."
          : "Não foi possível salvar o fornecedor.",
    };
  }

  revalidatePath("/compras/fornecedores");
  return { success: true };
}

export async function alternarAtivoFornecedor(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fornecedores")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o fornecedor.");
  }

  revalidatePath("/compras/fornecedores");
}
