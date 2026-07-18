"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  CANAIS_VENDA_PADRAO,
  CENTROS_CUSTO_PADRAO,
  PLANO_CONTAS_PADRAO,
} from "@/features/financeiro/validation";
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

  await supabase.from("canais_venda").insert(
    CANAIS_VENDA_PADRAO.map((canal) => ({
      empresa_id: data.id,
      tipo: canal.tipo,
      nome: canal.nome,
    })),
  );

  await supabase.from("centros_custo").insert(
    CENTROS_CUSTO_PADRAO.map((centro) => ({
      empresa_id: data.id,
      codigo: centro.codigo,
      nome: centro.nome,
    })),
  );

  // Duas fases: contas de nível 1 primeiro (para pegar o id gerado), depois
  // as de nível 2 já com conta_pai_id resolvido — mesmo resultado do
  // seed em SQL da migration 0040, só que para empresas criadas depois dela.
  const contasNivel1 = PLANO_CONTAS_PADRAO.filter((conta) => conta.contaPaiCodigo === null);
  const contasNivel2 = PLANO_CONTAS_PADRAO.filter((conta) => conta.contaPaiCodigo !== null);

  const { data: nivel1Inseridas } = await supabase
    .from("plano_contas")
    .insert(
      contasNivel1.map((conta) => ({
        empresa_id: data.id,
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
      })),
    )
    .select("id, codigo");

  const idPorCodigo = new Map((nivel1Inseridas ?? []).map((conta) => [conta.codigo, conta.id]));

  await supabase.from("plano_contas").insert(
    contasNivel2.map((conta) => ({
      empresa_id: data.id,
      codigo: conta.codigo,
      nome: conta.nome,
      tipo: conta.tipo,
      conta_pai_id: idPorCodigo.get(conta.contaPaiCodigo!) ?? null,
    })),
  );

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
