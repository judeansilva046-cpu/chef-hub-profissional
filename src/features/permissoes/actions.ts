"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/server/auth/dal";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { atualizarPapelSchema, convidarUsuarioSchema } from "./validation";

export interface PermissoesActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function revalidarPermissoes() {
  revalidatePath("/financeiro/permissoes");
}

/**
 * Convite por e-mail: só resolve para um usuário que já tem conta (Sprint 06
 * não inclui convite por e-mail externo/pendente, só vincular quem já existe
 * — fn_buscar_usuario_por_email, 0044). A policy usuarios_empresa_insert_dono
 * (0043) garante no banco que só o dono da empresa consegue de fato inserir.
 */
export async function convidarUsuario(
  _prevState: PermissoesActionState | undefined,
  formData: FormData,
): Promise<PermissoesActionState> {
  const { user } = await verifySession();
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = convidarUsuarioSchema.safeParse({
    email: formData.get("email"),
    papel: formData.get("papel"),
  });
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: encontrado, error: buscaError } = await supabase
    .rpc("fn_buscar_usuario_por_email", { p_email: validated.data.email })
    .maybeSingle();

  if (buscaError) return { formError: "Não foi possível buscar o usuário." };
  if (!encontrado) {
    return { formError: "Nenhuma conta encontrada com esse e-mail. A pessoa precisa se cadastrar primeiro." };
  }
  if (encontrado.id === user.id) {
    return { formError: "Você já é o dono desta empresa." };
  }

  const { error } = await supabase.from("usuarios_empresa").insert({
    empresa_id: empresa.id,
    usuario_id: encontrado.id,
    papel: validated.data.papel,
    convidado_por: user.id,
  });

  if (error) {
    return {
      formError: error.code === "23505" ? "Esse usuário já é membro da empresa." : "Não foi possível adicionar o membro.",
    };
  }

  revalidarPermissoes();
  return { success: true };
}

export async function atualizarPapelUsuario(id: string, papel: string) {
  const validated = atualizarPapelSchema.safeParse({ papel });
  if (!validated.success) {
    throw new Error("Papel inválido.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("usuarios_empresa").update({ papel: validated.data.papel }).eq("id", id);

  if (error) throw new Error("Não foi possível atualizar o papel.");
  revalidarPermissoes();
}

export async function alternarAtivoMembro(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("usuarios_empresa").update({ ativo }).eq("id", id);

  if (error) throw new Error("Não foi possível atualizar o membro.");
  revalidarPermissoes();
}
