"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/server/auth/dal";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { etapaSchema, leadSchema } from "./validation";

export interface FunilActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function criarLead(
  _prevState: FunilActionState | undefined,
  formData: FormData,
): Promise<FunilActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };
  const { user } = await verifySession();

  const validated = leadSchema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    origem: formData.get("origem"),
    etapaId: formData.get("etapaId"),
    valorEstimado: formData.get("valorEstimado") || 0,
    probabilidade: formData.get("probabilidade") || 0,
    proximaAcao: formData.get("proximaAcao"),
    proximaAcaoEm: formData.get("proximaAcaoEm"),
    observacoes: formData.get("observacoes"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_leads").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    telefone: validated.data.telefone,
    email: validated.data.email,
    origem: validated.data.origem,
    etapa_id: validated.data.etapaId,
    valor_estimado: validated.data.valorEstimado,
    probabilidade: validated.data.probabilidade,
    proxima_acao: validated.data.proximaAcao,
    proxima_acao_em: validated.data.proximaAcaoEm,
    observacoes: validated.data.observacoes,
    responsavel_id: user.id,
    criado_por: user.id,
  });

  if (error) return { formError: "Não foi possível salvar o lead." };

  revalidatePath("/crm/funil");
  return { success: true };
}

export async function moverLeadEtapa(leadId: string, etapaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_leads").update({ etapa_id: etapaId }).eq("id", leadId);
  if (error) throw new Error("Não foi possível mover o lead.");
  revalidatePath("/crm/funil");
}

export async function marcarLeadPerdido(leadId: string, motivo: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_leads")
    .update({ status: "perdido", motivo_perda: motivo || null })
    .eq("id", leadId);

  if (error) throw new Error("Não foi possível marcar o lead como perdido.");
  revalidatePath("/crm/funil");
}

export async function reabrirLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_leads")
    .update({ status: "aberto", motivo_perda: null })
    .eq("id", leadId);

  if (error) throw new Error("Não foi possível reabrir o lead.");
  revalidatePath("/crm/funil");
}

export async function converterLead(leadId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_converter_lead_em_cliente", { p_lead_id: leadId });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/funil");
  revalidatePath("/clientes");
  return data as string;
}

export async function criarEtapaFunil(
  _prevState: FunilActionState | undefined,
  formData: FormData,
): Promise<FunilActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = etapaSchema.safeParse({
    nome: formData.get("nome"),
    cor: formData.get("cor") || "#64748b",
    ordem: formData.get("ordem") || 0,
  });

  if (!validated.success) return { fieldErrors: validated.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_funil_etapas").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    cor: validated.data.cor,
    ordem: validated.data.ordem,
  });

  if (error) {
    if (error.code === "23505") return { fieldErrors: { nome: ["Já existe uma etapa com este nome."] } };
    return { formError: "Não foi possível salvar a etapa." };
  }

  revalidatePath("/crm/funil");
  return { success: true };
}
