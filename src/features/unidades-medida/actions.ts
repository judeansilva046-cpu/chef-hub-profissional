"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { unidadeMedidaSchema } from "./validation";

export interface UnidadeMedidaActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseUnidadeMedidaForm(formData: FormData) {
  return unidadeMedidaSchema.safeParse({
    nome: formData.get("nome"),
    sigla: formData.get("sigla"),
    tipoGrandeza: formData.get("tipoGrandeza"),
  });
}

export async function criarUnidadeMedida(
  _prevState: UnidadeMedidaActionState | undefined,
  formData: FormData,
): Promise<UnidadeMedidaActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseUnidadeMedidaForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("unidades_medida").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    sigla: validated.data.sigla,
    tipo_grandeza: validated.data.tipoGrandeza,
  });

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe uma unidade com essa sigla."
          : "Não foi possível salvar a unidade.",
    };
  }

  revalidatePath("/unidades-medida");
  return { success: true };
}

export async function atualizarUnidadeMedida(
  id: string,
  _prevState: UnidadeMedidaActionState | undefined,
  formData: FormData,
): Promise<UnidadeMedidaActionState> {
  const validated = parseUnidadeMedidaForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades_medida")
    .update({
      nome: validated.data.nome,
      sigla: validated.data.sigla,
      tipo_grandeza: validated.data.tipoGrandeza,
    })
    // empresa_id not null: RLS já bloqueia edição de linhas de sistema, mas
    // reforçamos aqui para nunca depender só da RLS numa ação com efeito de UI.
    .eq("id", id)
    .not("empresa_id", "is", null);

  if (error) {
    return {
      formError:
        error.code === "23505"
          ? "Já existe uma unidade com essa sigla."
          : "Não foi possível salvar a unidade.",
    };
  }

  revalidatePath("/unidades-medida");
  return { success: true };
}

export async function excluirUnidadeMedida(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades_medida")
    .delete()
    .eq("id", id)
    .not("empresa_id", "is", null);

  if (error) {
    throw new Error(
      "Não foi possível excluir a unidade — verifique se ela não está em uso.",
    );
  }

  revalidatePath("/unidades-medida");
}
