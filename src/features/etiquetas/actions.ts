"use server";

import { randomBytes, createHash } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { agenteImpressaoSchema, emitirEtiquetaSchema } from "./validation";

export interface EtiquetaActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function emitirEtiqueta(
  _prevState: EtiquetaActionState | undefined,
  formData: FormData,
): Promise<EtiquetaActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = emitirEtiquetaSchema.safeParse({
    loteId: formData.get("loteId"),
    tamanho: formData.get("tamanho"),
    quantidadeEtiquetas: formData.get("quantidadeEtiquetas"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: lote, error: loteError } = await supabase
    .from("estoque_lotes")
    .select("id, numero_lote, data_validade, data_entrada, ingredientes(nome)")
    .eq("id", validated.data.loteId)
    .eq("empresa_id", empresa.id)
    .single();

  if (loteError || !lote) {
    return { formError: "Lote não encontrado." };
  }

  const ingrediente = lote.ingredientes as unknown as { nome: string } | null;

  const payload = {
    produto: ingrediente?.nome ?? "—",
    loteNumero: lote.numero_lote,
    dataValidade: lote.data_validade,
    dataProducao: lote.data_entrada,
    tamanho: validated.data.tamanho,
    quantidadeEtiquetas: validated.data.quantidadeEtiquetas,
  };

  const { error } = await supabase.rpc("fn_emitir_etiqueta", {
    p_empresa_id: empresa.id,
    p_lote_id: validated.data.loteId,
    p_tamanho: validated.data.tamanho,
    p_quantidade_etiquetas: validated.data.quantidadeEtiquetas,
    p_payload: payload,
  });

  if (error) {
    return { formError: "Não foi possível emitir a etiqueta." };
  }

  revalidatePath("/estoque/etiquetas");
  return { success: true };
}

export interface CriarAgenteResult {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  chaveGerada?: string;
}

/**
 * A chave em texto puro só existe neste retorno — nunca é salva no banco
 * (só o hash SHA-256, em chave_api_hash). O usuário precisa copiar agora;
 * não há como recuperá-la depois.
 */
export async function criarAgenteImpressao(
  _prevState: CriarAgenteResult | undefined,
  formData: FormData,
): Promise<CriarAgenteResult> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = agenteImpressaoSchema.safeParse({ nome: formData.get("nome") });
  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const chave = randomBytes(32).toString("hex");
  const chaveHash = createHash("sha256").update(chave).digest("hex");

  const supabase = await createClient();
  const { error } = await supabase.from("agentes_impressao").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    chave_api_hash: chaveHash,
  });

  if (error) {
    return { formError: "Não foi possível criar o agente." };
  }

  revalidatePath("/estoque/etiquetas");
  return { chaveGerada: chave };
}

export async function alternarAtivoAgenteImpressao(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("agentes_impressao")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar o agente.");
  }

  revalidatePath("/estoque/etiquetas");
}

export async function excluirAgenteImpressao(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("agentes_impressao").delete().eq("id", id);

  if (error) {
    throw new Error("Não foi possível excluir o agente.");
  }

  revalidatePath("/estoque/etiquetas");
}

export async function cancelarTrabalhoImpressao(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fila_impressao").delete().eq("id", id);

  if (error) {
    throw new Error("Não foi possível cancelar — o trabalho já pode ter sido processado.");
  }

  revalidatePath("/estoque/etiquetas");
}
