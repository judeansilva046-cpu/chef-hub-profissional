"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { cancelamentoContaReceberSchema, contaReceberSchema, recebimentoParcelaSchema } from "./validation";

function revalidarContasReceber() {
  revalidatePath("/financeiro/contas-a-receber");
  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/financeiro/dashboard");
}

export interface ContaReceberActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function criarContaReceber(
  _prevState: ContaReceberActionState | undefined,
  formData: FormData,
): Promise<ContaReceberActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = contaReceberSchema.safeParse({
    descricao: formData.get("descricao"),
    clienteId: formData.get("clienteId"),
    planoContaId: formData.get("planoContaId"),
    centroCustoId: formData.get("centroCustoId"),
    valorTotal: formData.get("valorTotal"),
    numeroParcelas: formData.get("numeroParcelas"),
    primeiraDataVencimento: formData.get("primeiraDataVencimento"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_criar_conta_receber", {
    p_empresa_id: empresa.id,
    p_descricao: validated.data.descricao,
    p_valor_total: validated.data.valorTotal,
    p_numero_parcelas: validated.data.numeroParcelas,
    p_primeira_data_vencimento: validated.data.primeiraDataVencimento,
    p_cliente_id: validated.data.clienteId ?? undefined,
    p_plano_conta_id: validated.data.planoContaId ?? undefined,
    p_centro_custo_id: validated.data.centroCustoId ?? undefined,
    p_observacao: validated.data.observacao ?? undefined,
  });

  if (error) return { formError: "Não foi possível salvar a conta a receber." };

  revalidarContasReceber();
  return { success: true };
}

export async function registrarRecebimentoParcela(id: string, input: unknown): Promise<void> {
  const validated = recebimentoParcelaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados de recebimento inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_recebimento_parcela", {
    p_parcela_id: id,
    p_valor_recebido: validated.data.valorRecebido,
    p_forma_pagamento: validated.data.formaPagamento,
    p_data_recebimento: validated.data.dataRecebimento,
  });

  if (error) {
    throw new Error(error.message.includes("pendente") ? error.message : "Não foi possível registrar o recebimento.");
  }

  revalidarContasReceber();
}

export async function cancelarContaReceber(id: string, input: unknown): Promise<void> {
  const validated = cancelamentoContaReceberSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Informe o motivo do cancelamento.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cancelar_conta_receber", {
    p_conta_receber_id: id,
    p_motivo: validated.data.motivo,
  });

  if (error) throw new Error("Não foi possível cancelar a conta.");

  revalidarContasReceber();
}

export async function marcarParcelaConciliada(id: string, conciliado: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("contas_receber_parcelas")
    .update({
      conciliado,
      conciliado_em: conciliado ? new Date().toISOString() : null,
      conciliado_por: conciliado ? user?.id : null,
    })
    .eq("id", id);

  if (error) throw new Error("Não foi possível atualizar a conciliação.");

  revalidatePath("/financeiro/conciliacao");
}
