"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { cancelamentoContaPagarSchema, contaPagarSchema, pagamentoContaPagarSchema } from "./validation";

function revalidarContasPagar() {
  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/financeiro/dashboard");
}

export interface ContaPagarActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function criarContaPagar(
  _prevState: ContaPagarActionState | undefined,
  formData: FormData,
): Promise<ContaPagarActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return { formError: "Nenhuma empresa ativa." };

  const validated = contaPagarSchema.safeParse({
    descricao: formData.get("descricao"),
    fornecedorId: formData.get("fornecedorId"),
    planoContaId: formData.get("planoContaId"),
    centroCustoId: formData.get("centroCustoId"),
    numeroDocumento: formData.get("numeroDocumento"),
    valor: formData.get("valor"),
    dataVencimento: formData.get("dataVencimento"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contas_pagar").insert({
    empresa_id: empresa.id,
    descricao: validated.data.descricao,
    fornecedor_id: validated.data.fornecedorId,
    plano_conta_id: validated.data.planoContaId,
    centro_custo_id: validated.data.centroCustoId,
    numero_documento: validated.data.numeroDocumento,
    valor: validated.data.valor,
    data_vencimento: validated.data.dataVencimento,
    observacao: validated.data.observacao,
    categoria_origem: "manual",
    criado_por: user?.id,
  });

  if (error) return { formError: "Não foi possível salvar a conta a pagar." };

  revalidarContasPagar();
  return { success: true };
}

export async function registrarPagamentoContaPagar(id: string, input: unknown): Promise<void> {
  const validated = pagamentoContaPagarSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados de pagamento inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_registrar_pagamento_conta_pagar", {
    p_conta_pagar_id: id,
    p_valor_pago: validated.data.valorPago,
    p_forma_pagamento: validated.data.formaPagamento,
    p_data_pagamento: validated.data.dataPagamento,
  });

  if (error) {
    throw new Error(error.message.includes("pendente") ? error.message : "Não foi possível registrar o pagamento.");
  }

  revalidarContasPagar();
}

export async function cancelarContaPagar(id: string, input: unknown): Promise<void> {
  const validated = cancelamentoContaPagarSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Informe o motivo do cancelamento.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_cancelar_conta_pagar", {
    p_conta_pagar_id: id,
    p_motivo: validated.data.motivo,
  });

  if (error) {
    throw new Error(error.message.includes("paga") ? error.message : "Não foi possível cancelar a conta.");
  }

  revalidarContasPagar();
}

export async function gerarContasPagarDoMes(mesReferencia: string): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_gerar_contas_pagar_do_mes", {
    p_empresa_id: empresa.id,
    p_mes_referencia: mesReferencia,
  });

  if (error) throw new Error("Não foi possível gerar as contas do mês.");

  revalidarContasPagar();
  return data ?? 0;
}

export async function marcarContaPagarConciliada(id: string, conciliado: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("contas_pagar")
    .update({
      conciliado,
      conciliado_em: conciliado ? new Date().toISOString() : null,
      conciliado_por: conciliado ? user?.id : null,
    })
    .eq("id", id);

  if (error) throw new Error("Não foi possível atualizar a conciliação.");

  revalidatePath("/financeiro/conciliacao");
}
