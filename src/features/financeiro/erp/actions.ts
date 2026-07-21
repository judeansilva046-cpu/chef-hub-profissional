"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { PAPEIS_FINANCEIRO } from "@/server/auth/papeis-acoes";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";
import { criarAlerta } from "@/server/observabilidade/alerts";
import { registrarLog } from "@/server/observabilidade/logs";

import { statusTitulo } from "./calculations";
import {
  baixaSchema,
  bankTxSchema,
  cashFlowSchema,
  contaPagarSchema,
  contaReceberSchema,
} from "./validation";

function revalidarErp() {
  revalidatePath("/financeiro");
  revalidatePath("/financeiro/erp");
  revalidatePath("/financeiro/contas-pagar");
  revalidatePath("/financeiro/contas-receber");
  revalidatePath("/financeiro/fluxo-caixa");
  revalidatePath("/financeiro/dre");
  revalidatePath("/financeiro/conciliacao");
}

function hojeIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function gate() {
  await requirePapel(...PAPEIS_FINANCEIRO);
  return requireEmpresaAtual();
}

export async function criarContaPagar(input: unknown): Promise<string> {
  const empresa = await gate();
  const validated = contaPagarSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const v = validated.data;
  const supabase = await createClient();
  const totalParcelas = v.installmentTotal ?? 1;
  const valorParcela = Math.round((v.amount / totalParcelas) * 100) / 100;
  let firstId: string | null = null;

  for (let i = 1; i <= totalParcelas; i += 1) {
    const due = addMonthsIso(v.dueDate, i - 1);
    const amount =
      i === totalParcelas
        ? Math.round((v.amount - valorParcela * (totalParcelas - 1)) * 100) / 100
        : valorParcela;
    const parentId: string | null = firstId;

    const payload = {
      empresa_id: empresa.id,
      description:
        totalParcelas > 1
          ? `${v.description} (${i}/${totalParcelas})`
          : v.description,
      amount,
      competence_date: v.competenceDate,
      due_date: due,
      fornecedor_id: v.fornecedorId ?? null,
      cost_center_id: v.costCenterId ?? null,
      category_id: v.categoryId ?? null,
      bank_account_id: v.bankAccountId ?? null,
      interest_amount: i === 1 ? (v.interestAmount ?? 0) : 0,
      fine_amount: i === 1 ? (v.fineAmount ?? 0) : 0,
      installment_number: i,
      installment_total: totalParcelas,
      parent_id: parentId,
      attachment_url: v.attachmentUrl ?? null,
      notes: v.notes ?? null,
      status: statusTitulo(due, amount, 0, hojeIso()),
    };

    const { data, error } = await supabase
      .from("accounts_payable")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Não foi possível criar a conta a pagar.");
    }
    const createdId: string = data.id;
    if (!firstId) firstId = createdId;
  }

  void registrarAuditoria({
    acao: "criar",
    entidade: "accounts_payable",
    registroId: firstId,
    valorNovo: { amount: v.amount, parcelas: totalParcelas },
  });

  revalidarErp();
  return firstId!;
}

export async function baixarContaPagar(input: unknown): Promise<void> {
  const empresa = await gate();
  const validated = baixaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("accounts_payable")
    .select("*")
    .eq("id", validated.data.id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();
  if (error || !row) throw new Error("Conta a pagar não encontrada.");

  const paid = Number(row.paid_amount) + validated.data.valor;
  const total =
    Number(row.amount) + Number(row.interest_amount) + Number(row.fine_amount);
  const status = statusTitulo(row.due_date, total, paid, hojeIso());

  const { error: updErr } = await supabase
    .from("accounts_payable")
    .update({
      paid_amount: paid,
      status: status === "overdue" && paid > 0 && paid < total ? "partial" : status,
      paid_at: paid + 0.009 >= total ? new Date().toISOString() : row.paid_at,
      bank_account_id: validated.data.bankAccountId ?? row.bank_account_id,
    })
    .eq("id", row.id)
    .eq("empresa_id", empresa.id);

  if (updErr) throw new Error("Falha na baixa.");

  await supabase.from("cash_flow").insert({
    empresa_id: empresa.id,
    flow_date: hojeIso(),
    tipo: "saida",
    amount: validated.data.valor,
    description: `Pagamento: ${row.description}`,
    bank_account_id: validated.data.bankAccountId ?? row.bank_account_id,
    reference_type: "accounts_payable",
    reference_id: row.id,
    category_id: row.category_id,
    cost_center_id: row.cost_center_id,
  });

  void registrarAuditoria({
    acao: "pagamento",
    entidade: "accounts_payable",
    registroId: row.id,
    valorNovo: { valor: validated.data.valor, status },
  });

  revalidarErp();
}

export async function criarContaReceber(input: unknown): Promise<string> {
  const empresa = await gate();
  const validated = contaReceberSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const v = validated.data;
  const supabase = await createClient();
  const totalParcelas = v.installmentTotal ?? 1;
  const valorParcela = Math.round((v.amount / totalParcelas) * 100) / 100;
  let firstId: string | null = null;

  for (let i = 1; i <= totalParcelas; i += 1) {
    const due = addMonthsIso(v.dueDate, i - 1);
    const amount =
      i === totalParcelas
        ? Math.round((v.amount - valorParcela * (totalParcelas - 1)) * 100) / 100
        : valorParcela;
    const auto = Boolean(v.autoSettle) && i === 1;
    const received = auto ? amount : 0;
    const status = auto
      ? "paid"
      : statusTitulo(due, amount, 0, hojeIso());
    const parentId: string | null = firstId;

    const payload = {
      empresa_id: empresa.id,
      description:
        totalParcelas > 1
          ? `${v.description} (${i}/${totalParcelas})`
          : v.description,
      amount,
      competence_date: v.competenceDate,
      due_date: due,
      cliente_id: v.clienteId ?? null,
      pedido_id: v.pedidoId ?? null,
      cost_center_id: v.costCenterId ?? null,
      category_id: v.categoryId ?? null,
      bank_account_id: v.bankAccountId ?? null,
      source: v.source ?? "outro",
      interest_amount: i === 1 ? (v.interestAmount ?? 0) : 0,
      fine_amount: i === 1 ? (v.fineAmount ?? 0) : 0,
      installment_number: i,
      installment_total: totalParcelas,
      parent_id: parentId,
      auto_settle: auto,
      received_amount: received,
      received_at: auto ? new Date().toISOString() : null,
      status,
      notes: v.notes ?? null,
    };

    const { data, error } = await supabase
      .from("accounts_receivable")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("Não foi possível criar a conta a receber.");
    }
    const createdId: string = data.id;
    if (!firstId) firstId = createdId;

    if (auto) {
      await supabase.from("cash_flow").insert({
        empresa_id: empresa.id,
        flow_date: hojeIso(),
        tipo: "entrada",
        amount,
        description: `Recebimento automático: ${v.description}`,
        bank_account_id: v.bankAccountId ?? null,
        reference_type: "accounts_receivable",
        reference_id: createdId,
        category_id: v.categoryId ?? null,
      });
    }
  }

  void registrarAuditoria({
    acao: "criar",
    entidade: "accounts_receivable",
    registroId: firstId,
    valorNovo: { amount: v.amount, source: v.source },
  });

  revalidarErp();
  return firstId!;
}

export async function baixarContaReceber(input: unknown): Promise<void> {
  const empresa = await gate();
  const validated = baixaSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("accounts_receivable")
    .select("*")
    .eq("id", validated.data.id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();
  if (error || !row) throw new Error("Conta a receber não encontrada.");

  const received = Number(row.received_amount) + validated.data.valor;
  const total =
    Number(row.amount) + Number(row.interest_amount) + Number(row.fine_amount);
  const status = statusTitulo(row.due_date, total, received, hojeIso());

  const { error: updErr } = await supabase
    .from("accounts_receivable")
    .update({
      received_amount: received,
      status:
        status === "overdue" && received > 0 && received < total
          ? "partial"
          : status,
      received_at:
        received + 0.009 >= total ? new Date().toISOString() : row.received_at,
      bank_account_id: validated.data.bankAccountId ?? row.bank_account_id,
    })
    .eq("id", row.id);

  if (updErr) throw new Error("Falha na baixa.");

  await supabase.from("cash_flow").insert({
    empresa_id: empresa.id,
    flow_date: hojeIso(),
    tipo: "entrada",
    amount: validated.data.valor,
    description: `Recebimento: ${row.description}`,
    bank_account_id: validated.data.bankAccountId ?? row.bank_account_id,
    reference_type: "accounts_receivable",
    reference_id: row.id,
    category_id: row.category_id,
  });

  void registrarAuditoria({
    acao: "pagamento",
    entidade: "accounts_receivable",
    registroId: row.id,
    valorNovo: { valor: validated.data.valor },
  });

  revalidarErp();
}

export async function registrarMovimentoCaixa(input: unknown): Promise<string> {
  const empresa = await gate();
  const validated = cashFlowSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const v = validated.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_flow")
    .insert({
      empresa_id: empresa.id,
      flow_date: v.flowDate,
      tipo: v.tipo,
      amount: v.amount,
      description: v.description,
      category_id: v.categoryId ?? null,
      cost_center_id: v.costCenterId ?? null,
      bank_account_id: v.bankAccountId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível registrar o fluxo.");

  void registrarAuditoria({
    acao: "criar",
    entidade: "cash_flow",
    registroId: data.id,
    valorNovo: v,
  });
  revalidarErp();
  return data.id;
}

export async function registrarTransacaoBancaria(
  input: unknown,
): Promise<string> {
  const empresa = await gate();
  const validated = bankTxSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }
  const v = validated.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bank_transactions")
    .insert({
      empresa_id: empresa.id,
      bank_account_id: v.bankAccountId,
      tx_date: v.txDate,
      tipo: v.tipo,
      amount: v.amount,
      description: v.description,
      source: v.source ?? "manual",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível registrar a transação.");

  void registrarAuditoria({
    acao: "criar",
    entidade: "bank_transactions",
    registroId: data.id,
    valorNovo: v,
  });
  revalidarErp();
  return data.id;
}

export async function conciliarTransacao(id: string): Promise<void> {
  const empresa = await gate();
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_transactions")
    .update({
      reconciled: true,
      reconciled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("empresa_id", empresa.id);
  if (error) throw new Error("Falha na conciliação.");

  void registrarAuditoria({
    acao: "editar",
    entidade: "bank_transactions",
    registroId: id,
    valorNovo: { reconciled: true },
  });
  revalidarErp();
}

export async function sincronizarAlertasFinanceiros(): Promise<number> {
  const empresa = await gate();
  const { carregarDashboardErp } = await import("./queries");
  const dash = await carregarDashboardErp();
  let n = 0;
  for (const alerta of dash.alertas) {
    const id = await criarAlerta({
      tipo: alerta.tipo,
      severidade: alerta.severidade === "critical" ? "critical" : alerta.severidade,
      titulo: alerta.tipo.replace(/_/g, " "),
      mensagem: alerta.mensagem,
      entidade: "financeiro",
    });
    if (id) n += 1;
  }
  void registrarLog({
    nivel: n > 0 ? "WARNING" : "INFO",
    modulo: "financeiro",
    mensagem: `Sync alertas financeiros: ${n} criado(s)`,
    empresaId: empresa.id,
  });
  return n;
}
