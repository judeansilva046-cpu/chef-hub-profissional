"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { abrirCaixaSchema, fecharCaixaSchema, movimentacaoCaixaSchema } from "./validation";

function revalidarCaixa() {
  revalidatePath("/caixa");
  revalidatePath("/pdv");
}

export async function abrirCaixa(input: unknown): Promise<string> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const validated = abrirCaixaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_abrir_caixa", {
    p_empresa_id: empresa.id,
    p_saldo_inicial: validated.data.saldoInicial,
    p_observacoes: validated.data.observacoes ?? undefined,
  });

  if (error) {
    throw new Error(error.message.includes("caixa aberto") ? error.message : "Não foi possível abrir o caixa.");
  }

  revalidarCaixa();
  return data;
}

export async function registrarMovimentacaoCaixa(caixaId: string, input: unknown): Promise<void> {
  const validated = movimentacaoCaixaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_movimentacao_caixa", {
    p_caixa_id: caixaId,
    p_tipo: validated.data.tipo,
    p_valor: validated.data.valor,
    p_referencia_tipo: "manual",
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) {
    throw new Error(error.message.includes("fechado") ? error.message : "Não foi possível registrar a movimentação.");
  }

  revalidarCaixa();
}

export async function fecharCaixa(caixaId: string, input: unknown): Promise<void> {
  const validated = fecharCaixaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_fechar_caixa", {
    p_caixa_id: caixaId,
    p_saldo_informado: validated.data.saldoInformado,
    p_observacoes: validated.data.observacoes ?? undefined,
  });

  if (error) {
    throw new Error(error.message.includes("fechado") ? error.message : "Não foi possível fechar o caixa.");
  }

  revalidarCaixa();
}
