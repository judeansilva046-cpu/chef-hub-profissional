"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { configFidelidadeSchema, movimentacaoPontosSchema, nivelFidelidadeSchema } from "./validation";

export interface FidelidadeActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function salvarConfigFidelidade(
  _prevState: FidelidadeActionState | undefined,
  formData: FormData,
): Promise<FidelidadeActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = configFidelidadeSchema.safeParse({
    ativo: formData.get("ativo") ?? undefined,
    pontosPorValor: formData.get("pontosPorValor"),
    valorPontoResgate: formData.get("valorPontoResgate"),
    validadeDias: formData.get("validadeDias"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_fidelidade_config").upsert({
    empresa_id: empresa.id,
    ativo: validated.data.ativo,
    pontos_por_valor: validated.data.pontosPorValor,
    valor_ponto_resgate: validated.data.valorPontoResgate,
    validade_dias: validated.data.validadeDias,
  });

  if (error) return { formError: "Não foi possível salvar a configuração." };

  revalidatePath("/crm/fidelidade");
  return { success: true };
}

export async function criarNivelFidelidade(
  _prevState: FidelidadeActionState | undefined,
  formData: FormData,
): Promise<FidelidadeActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = nivelFidelidadeSchema.safeParse({
    nome: formData.get("nome"),
    pontosMinimos: formData.get("pontosMinimos"),
    beneficios: formData.get("beneficios"),
    ordem: formData.get("ordem") || 0,
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_fidelidade_niveis").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    pontos_minimos: validated.data.pontosMinimos,
    beneficios: validated.data.beneficios,
    ordem: validated.data.ordem,
  });

  if (error) return { formError: "Não foi possível salvar o nível." };

  revalidatePath("/crm/fidelidade");
  return { success: true };
}

export async function alternarAtivoNivelFidelidade(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_fidelidade_niveis").update({ ativo }).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar o nível.");
  revalidatePath("/crm/fidelidade");
}

export async function concederPontosManual(input: { clienteId: string; pontos: number; observacao?: string }) {
  const validated = movimentacaoPontosSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_conceder_pontos_manual", {
    p_cliente_id: validated.data.clienteId,
    p_pontos: validated.data.pontos,
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/fidelidade");
  revalidatePath(`/clientes/${validated.data.clienteId}`);
}

export async function resgatarPontos(input: { clienteId: string; pontos: number; observacao?: string }) {
  const validated = movimentacaoPontosSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_resgatar_pontos_fidelidade", {
    p_cliente_id: validated.data.clienteId,
    p_pontos: validated.data.pontos,
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/fidelidade");
  revalidatePath(`/clientes/${validated.data.clienteId}`);
}

export async function estornarMovimentacaoFidelidade(movimentacaoId: string, clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_estornar_movimentacao_fidelidade", {
    p_movimentacao_id: movimentacaoId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/fidelidade");
  revalidatePath(`/clientes/${clienteId}`);
}

export async function processarPontosExpirados() {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_expirar_pontos_fidelidade", {
    p_empresa_id: empresa.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/fidelidade");
  return data as number;
}
