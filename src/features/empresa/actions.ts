"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/server/auth/dal";
import {
  EMPRESA_ATIVA_COOKIE,
  getEmpresasDoUsuario,
} from "@/server/auth/get-empresa-atual";

import { empresaSchema } from "./validation";

export interface EmpresaActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const EMPRESA_ATIVA_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

async function definirEmpresaAtiva(empresaId: string) {
  const cookieStore = await cookies();
  cookieStore.set(EMPRESA_ATIVA_COOKIE, empresaId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: EMPRESA_ATIVA_COOKIE_MAX_AGE,
  });
}

export async function criarEmpresa(
  _prevState: EmpresaActionState | undefined,
  formData: FormData,
): Promise<EmpresaActionState> {
  const { user } = await verifySession();

  const validated = empresaSchema.safeParse({
    nome: formData.get("nome"),
    tipoNegocio: formData.get("tipoNegocio"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empresas")
    .insert({
      usuario_id: user.id,
      nome: validated.data.nome,
      tipo_negocio: validated.data.tipoNegocio,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { formError: "Não foi possível criar a empresa. Tente novamente." };
  }

  await definirEmpresaAtiva(data.id);
  redirect("/fichas-tecnicas");
}

export async function selecionarEmpresa(empresaId: string) {
  const empresas = await getEmpresasDoUsuario();
  const pertenceAoUsuario = empresas.some(
    (empresa) => empresa.id === empresaId,
  );

  if (!pertenceAoUsuario) {
    return;
  }

  await definirEmpresaAtiva(empresaId);
  redirect("/fichas-tecnicas");
}
