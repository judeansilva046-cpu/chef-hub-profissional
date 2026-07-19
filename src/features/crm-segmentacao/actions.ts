"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import type { CriteriosSegmentoPersonalizado } from "./calculations";
import { segmentoPersonalizadoSchema } from "./validation";

export interface SegmentoPersonalizadoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

function parseCriterios(formData: FormData) {
  return segmentoPersonalizadoSchema.safeParse({
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    gastoMinimo: formData.get("gastoMinimo"),
    gastoMaximo: formData.get("gastoMaximo"),
    ticketMedioMinimo: formData.get("ticketMedioMinimo"),
    frequenciaMinima: formData.get("frequenciaMinima"),
    diasSemComprarMinimo: formData.get("diasSemComprarMinimo"),
    tags: formData.get("tags"),
    origem: formData.get("origem"),
  });
}

function montarCriterios(dados: ReturnType<typeof segmentoPersonalizadoSchema.parse>): CriteriosSegmentoPersonalizado {
  const criterios: CriteriosSegmentoPersonalizado = {};
  if (dados.gastoMinimo !== undefined) criterios.gastoMinimo = dados.gastoMinimo;
  if (dados.gastoMaximo !== undefined) criterios.gastoMaximo = dados.gastoMaximo;
  if (dados.ticketMedioMinimo !== undefined) criterios.ticketMedioMinimo = dados.ticketMedioMinimo;
  if (dados.frequenciaMinima !== undefined) criterios.frequenciaMinima = dados.frequenciaMinima;
  if (dados.diasSemComprarMinimo !== undefined) criterios.diasSemComprarMinimo = dados.diasSemComprarMinimo;
  if (dados.tags !== undefined) criterios.tags = dados.tags;
  if (dados.origem) criterios.origem = dados.origem;
  return criterios;
}

export async function criarSegmentoPersonalizado(
  _prevState: SegmentoPersonalizadoActionState | undefined,
  formData: FormData,
): Promise<SegmentoPersonalizadoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = parseCriterios(formData);
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_segmentos_personalizados").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    descricao: validated.data.descricao,
    criterios: montarCriterios(validated.data) as Record<string, string | number | string[]>,
  });

  if (error) return { formError: "Não foi possível salvar o segmento." };

  revalidatePath("/crm/segmentacao");
  return { success: true };
}

export async function alternarAtivoSegmentoPersonalizado(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_segmentos_personalizados")
    .update({ ativo })
    .eq("id", id);

  if (error) throw new Error("Não foi possível atualizar o segmento.");
  revalidatePath("/crm/segmentacao");
}

export async function excluirSegmentoPersonalizado(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_segmentos_personalizados").delete().eq("id", id);

  if (error) throw new Error("Não foi possível excluir o segmento.");
  revalidatePath("/crm/segmentacao");
}
