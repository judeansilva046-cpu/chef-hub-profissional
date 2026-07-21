"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";

import {
  alterarPapelSchema,
  convidarMembroSchema,
} from "./validation";

export interface EquipeActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidarEquipe() {
  revalidatePath("/equipe");
}

export async function adicionarMembro(
  _prevState: EquipeActionState | undefined,
  formData: FormData,
): Promise<EquipeActionState> {
  const empresa = await requireEmpresaAtual();
  await requirePapel("owner", "gerente");

  const validated = convidarMembroSchema.safeParse({
    email: formData.get("email"),
    papel: formData.get("papel"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_convidar_membro_por_email", {
    p_empresa_id: empresa.id,
    p_email: validated.data.email,
    p_papel: validated.data.papel,
  });

  if (error) {
    const message = error.message.includes("Usuário precisa criar conta")
      ? error.message
      : error.message.includes("owner ou gerente")
        ? "Apenas owner ou gerente podem convidar membros."
        : "Não foi possível adicionar o membro.";
    return { formError: message };
  }

  revalidarEquipe();
  return { success: true };
}

export async function alterarPapel(
  membroId: string,
  papel: string,
): Promise<EquipeActionState> {
  const empresa = await requireEmpresaAtual();
  await requirePapel("owner", "gerente");

  const validated = alterarPapelSchema.safeParse({ membroId, papel });
  if (!validated.success) {
    return { formError: "Dados inválidos para alterar o papel." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("membros_empresa")
    .update({ papel: validated.data.papel })
    .eq("id", validated.data.membroId)
    .eq("empresa_id", empresa.id);

  if (error) {
    return {
      formError: error.message.includes("owner primário")
        ? error.message
        : "Não foi possível alterar o papel.",
    };
  }

  revalidarEquipe();
  return { success: true };
}

export async function alternarAtivo(membroId: string, ativo: boolean) {
  const empresa = await requireEmpresaAtual();
  await requirePapel("owner", "gerente");

  const supabase = await createClient();
  const { error } = await supabase
    .from("membros_empresa")
    .update({ ativo })
    .eq("id", membroId)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error(
      error.message.includes("owner primário")
        ? error.message
        : "Não foi possível alterar o status do membro.",
    );
  }

  revalidarEquipe();
}

export async function removerMembro(membroId: string) {
  const empresa = await requireEmpresaAtual();
  await requirePapel("owner", "gerente");

  const supabase = await createClient();
  const { error } = await supabase
    .from("membros_empresa")
    .delete()
    .eq("id", membroId)
    .eq("empresa_id", empresa.id);

  if (error) {
    throw new Error(
      error.message.includes("owner primário")
        ? error.message
        : "Não foi possível remover o membro.",
    );
  }

  revalidarEquipe();
}
