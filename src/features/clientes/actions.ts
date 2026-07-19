"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { clienteSchema } from "./validation";

export interface ClienteActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseClienteForm(formData: FormData) {
  return clienteSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    documento: formData.get("documento"),
    endereco: formData.get("endereco"),
    segmento: formData.get("segmento"),
    dataNascimento: formData.get("dataNascimento"),
    origem: formData.get("origem"),
    tags: formData.get("tags"),
    restricoesAlimentares: formData.get("restricoesAlimentares"),
    preferencias: formData.get("preferencias"),
    observacoes: formData.get("observacoes"),
    optInWhatsapp: formData.get("optInWhatsapp") ?? undefined,
    optInEmail: formData.get("optInEmail") ?? undefined,
    optInSms: formData.get("optInSms") ?? undefined,
  });
}

function paraColunas(dados: ReturnType<typeof clienteSchema.parse>) {
  return {
    nome: dados.nome,
    telefone: dados.telefone,
    whatsapp: dados.whatsapp,
    email: dados.email,
    documento: dados.documento,
    endereco: dados.endereco,
    segmento: dados.segmento,
    data_nascimento: dados.dataNascimento,
    origem: dados.origem,
    tags: dados.tags,
    restricoes_alimentares: dados.restricoesAlimentares,
    preferencias: dados.preferencias,
    observacoes: dados.observacoes,
    opt_in_whatsapp: dados.optInWhatsapp,
    opt_in_email: dados.optInEmail,
    opt_in_sms: dados.optInSms,
  };
}

export async function criarCliente(
  _prevState: ClienteActionState | undefined,
  formData: FormData,
): Promise<ClienteActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = parseClienteForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").insert({
    empresa_id: empresa.id,
    ...paraColunas(validated.data),
  });

  if (error) {
    return { formError: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  return { success: true };
}

export async function atualizarCliente(
  id: string,
  _prevState: ClienteActionState | undefined,
  formData: FormData,
): Promise<ClienteActionState> {
  const validated = parseClienteForm(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update(paraColunas(validated.data))
    .eq("id", id);

  if (error) {
    return { formError: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function alternarAtivoCliente(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o cliente.");
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
}

/** Consentimento LGPD é uma ação própria (não um campo do formulário geral) para sempre carimbar consentimento_lgpd_em no momento exato da concessão — nunca deixar o cliente da API informar essa data. */
export async function atualizarConsentimentoLgpd(id: string, consentimento: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      consentimento_lgpd: consentimento,
      consentimento_lgpd_em: consentimento ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o consentimento LGPD.");
  }

  revalidatePath(`/clientes/${id}`);
}
