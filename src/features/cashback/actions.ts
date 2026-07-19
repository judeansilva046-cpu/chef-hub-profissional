"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { configCashbackSchema, movimentacaoCashbackSchema } from "./validation";

export interface CashbackActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function salvarConfigCashback(
  _prevState: CashbackActionState | undefined,
  formData: FormData,
): Promise<CashbackActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = configCashbackSchema.safeParse({
    ativo: formData.get("ativo") ?? undefined,
    tipo: formData.get("tipo"),
    percentual: formData.get("percentual") || 0,
    valorFixo: formData.get("valorFixo") || 0,
    limitePorVenda: formData.get("limitePorVenda") || 0,
    validadeDias: formData.get("validadeDias"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_cashback_config").upsert({
    empresa_id: empresa.id,
    ativo: validated.data.ativo,
    tipo: validated.data.tipo,
    percentual: validated.data.percentual,
    valor_fixo: validated.data.valorFixo,
    limite_por_venda: validated.data.limitePorVenda,
    validade_dias: validated.data.validadeDias,
  });

  if (error) return { formError: "Não foi possível salvar a configuração." };

  revalidatePath("/crm/cashback");
  return { success: true };
}

export async function resgatarCashback(input: { clienteId: string; valor: number; observacao?: string }) {
  const validated = movimentacaoCashbackSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_resgatar_cashback", {
    p_cliente_id: validated.data.clienteId,
    p_valor: validated.data.valor,
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/cashback");
  revalidatePath(`/clientes/${validated.data.clienteId}`);
}

export async function estornarMovimentacaoCashback(movimentacaoId: string, clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_estornar_movimentacao_cashback", {
    p_movimentacao_id: movimentacaoId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/cashback");
  revalidatePath(`/clientes/${clienteId}`);
}

export async function processarCashbackExpirado() {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_expirar_cashback", {
    p_empresa_id: empresa.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/crm/cashback");
  return data as number;
}
