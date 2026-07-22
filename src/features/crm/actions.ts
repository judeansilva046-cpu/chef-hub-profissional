"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";

import {
  aplicarSaldo,
  calcularCashback,
  calcularPontosAcumulo,
  dataExpiracaoPontos,
  podeResgatarPontos,
  validarCupom,
} from "./calculations";
import { enviarComunicacaoCliente } from "./communication";
import {
  avaliarSegmentos,
  garantirCrmDefaults,
  obterProgramaFidelidade,
  saldoCashbackCliente,
  saldoPontosCliente,
} from "./queries";
import {
  campanhaSchema,
  cupomSchema,
  loyaltyProgramSchema,
  perfilClienteSchema,
  pontosSchema,
  resgatarCupomSchema,
} from "./validation";

function revalidarCrm() {
  revalidatePath("/crm");
  revalidatePath("/crm/fidelidade");
  revalidatePath("/crm/cupons");
  revalidatePath("/crm/campanhas");
  revalidatePath("/crm/segmentos");
  revalidatePath("/clientes");
}

export async function salvarPerfilCliente(input: unknown): Promise<void> {
  await requirePapel("caixa", "garcom");
  const empresa = await requireEmpresaAtual();
  const parsed = perfilClienteSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const supabase = await createClient();
  const row = {
    empresa_id: empresa.id,
    cliente_id: parsed.data.clienteId,
    birth_date: parsed.data.birthDate || null,
    origin_channel: parsed.data.originChannel || null,
    dietary_preferences: parsed.data.dietaryPreferences ?? [],
    dietary_restrictions: parsed.data.dietaryRestrictions ?? [],
    consent_whatsapp: parsed.data.consentWhatsapp ?? false,
    consent_email: parsed.data.consentEmail ?? false,
    consent_sms: parsed.data.consentSms ?? false,
    consent_push: parsed.data.consentPush ?? false,
    consent_updated_at: new Date().toISOString(),
    notes: parsed.data.notes || null,
  };

  const { error } = await supabase.from("customers_profiles").upsert(row, {
    onConflict: "empresa_id,cliente_id",
  });
  if (error) throw new Error("Não foi possível salvar o perfil CRM.");

  void registrarAuditoria({
    acao: "editar",
    entidade: "customers_profiles",
    registroId: parsed.data.clienteId,
    valorNovo: row,
  });
  revalidarCrm();
}

export async function salvarProgramaFidelidade(input: unknown): Promise<void> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  await garantirCrmDefaults();
  const parsed = loyaltyProgramSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_programs").upsert(
    {
      empresa_id: empresa.id,
      name: parsed.data.name,
      points_per_currency: parsed.data.pointsPerCurrency,
      currency_per_point: parsed.data.currencyPerPoint,
      cashback_percent: parsed.data.cashbackPercent,
      points_validity_days: parsed.data.pointsValidityDays,
      min_redeem_points: parsed.data.minRedeemPoints,
      welcome_points: parsed.data.welcomePoints,
      active: parsed.data.active ?? true,
    },
    { onConflict: "empresa_id" },
  );
  if (error) throw new Error("Não foi possível salvar o programa de fidelidade.");

  void registrarAuditoria({
    acao: "configuracao",
    entidade: "loyalty_programs",
    valorNovo: parsed.data,
  });
  revalidarCrm();
}

export async function acumularPontosVenda(input: {
  clienteId: string;
  valorCompra: number;
  referenceId?: string;
}): Promise<{ points: number; cashback: number }> {
  await requirePapel("caixa", "garcom");
  const empresa = await requireEmpresaAtual();
  const program = await obterProgramaFidelidade();
  if (!program?.active) return { points: 0, cashback: 0 };

  const points = calcularPontosAcumulo(input.valorCompra, Number(program.points_per_currency));
  const cashback = calcularCashback(input.valorCompra, Number(program.cashback_percent));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (points > 0) {
    const saldo = await saldoPontosCliente(input.clienteId);
    const balance = aplicarSaldo(saldo, points, "credito");
    await supabase.from("loyalty_points").insert({
      empresa_id: empresa.id,
      cliente_id: input.clienteId,
      program_id: program.id,
      tipo: "acumulo",
      points,
      balance_after: balance,
      reference_tipo: "venda",
      reference_id: input.referenceId ?? null,
      expires_at: dataExpiracaoPontos(new Date().toISOString(), program.points_validity_days),
      created_by: user?.id,
    });
  }

  if (cashback > 0) {
    const saldoCb = await saldoCashbackCliente(input.clienteId);
    await supabase.from("cashback_transactions").insert({
      empresa_id: empresa.id,
      cliente_id: input.clienteId,
      tipo: "credito",
      amount: cashback,
      balance_after: aplicarSaldo(saldoCb, cashback, "credito"),
      reference_tipo: "venda",
      reference_id: input.referenceId ?? null,
      created_by: user?.id,
    });
  }

  revalidarCrm();
  return { points, cashback };
}

export async function resgatarPontos(input: unknown): Promise<{ valor: number }> {
  await requirePapel("caixa", "garcom");
  const empresa = await requireEmpresaAtual();
  const parsed = pontosSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const program = await obterProgramaFidelidade();
  if (!program?.active) throw new Error("Programa de fidelidade inativo.");

  const saldo = await saldoPontosCliente(parsed.data.clienteId);
  const check = podeResgatarPontos(
    saldo,
    parsed.data.points,
    Number(program.min_redeem_points),
  );
  if (!check.ok) throw new Error(check.motivo);

  const valor = parsed.data.points * Number(program.currency_per_point);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("loyalty_points").insert({
    empresa_id: empresa.id,
    cliente_id: parsed.data.clienteId,
    program_id: program.id,
    tipo: "resgate",
    points: -parsed.data.points,
    balance_after: aplicarSaldo(saldo, parsed.data.points, "debito"),
    notes: parsed.data.notes ?? null,
    created_by: user?.id,
  });

  void registrarAuditoria({
    acao: "outro",
    entidade: "loyalty_points",
    registroId: parsed.data.clienteId,
    valorNovo: { points: parsed.data.points, valor },
  });

  revalidarCrm();
  return { valor: Math.round(valor * 100) / 100 };
}

export async function criarCupom(input: unknown): Promise<string> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const parsed = cupomSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      empresa_id: empresa.id,
      code: parsed.data.code.toUpperCase(),
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      tipo: parsed.data.tipo,
      discount_percent: parsed.data.discountPercent ?? null,
      discount_amount: parsed.data.discountAmount ?? null,
      gift_description: parsed.data.giftDescription ?? null,
      min_order_amount: parsed.data.minOrderAmount,
      max_uses: parsed.data.maxUses ?? null,
      max_uses_per_customer: parsed.data.maxUsesPerCustomer,
      starts_at: parsed.data.startsAt ?? new Date().toISOString(),
      ends_at: parsed.data.endsAt ?? null,
      segment_key: parsed.data.segmentKey ?? null,
      active: parsed.data.active ?? true,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Não foi possível criar o cupom (código duplicado?).");

  void registrarAuditoria({
    acao: "criar",
    entidade: "coupons",
    registroId: data.id,
    valorNovo: parsed.data,
  });
  revalidarCrm();
  return data.id;
}

export async function resgatarCupom(input: unknown): Promise<{ desconto: number }> {
  await requirePapel("caixa", "garcom");
  const empresa = await requireEmpresaAtual();
  const parsed = resgatarCupomSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const supabase = await createClient();
  const { data: cupom, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("code", parsed.data.code.toUpperCase())
    .maybeSingle();

  if (error || !cupom) throw new Error("Cupom não encontrado.");

  let customerUses = 0;
  let primeiraCompra = true;
  let isAniversario = false;
  let diasInativo: number | null = null;

  if (parsed.data.clienteId) {
    const { count } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", cupom.id)
      .eq("cliente_id", parsed.data.clienteId);
    customerUses = count ?? 0;

    const { count: compras } = await supabase
      .from("vendas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("cliente_id", parsed.data.clienteId);
    primeiraCompra = (compras ?? 0) === 0;

    const { data: perfil } = await supabase
      .from("customers_profiles")
      .select("birth_date")
      .eq("empresa_id", empresa.id)
      .eq("cliente_id", parsed.data.clienteId)
      .maybeSingle();
    if (perfil?.birth_date) {
      const hoje = new Date();
      const birth = new Date(perfil.birth_date);
      isAniversario =
        birth.getUTCDate() === hoje.getUTCDate() &&
        birth.getUTCMonth() === hoje.getUTCMonth();
    }

    const { data: ultima } = await supabase
      .from("vendas")
      .select("data_venda")
      .eq("empresa_id", empresa.id)
      .eq("cliente_id", parsed.data.clienteId)
      .order("data_venda", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultima?.data_venda) {
      diasInativo = Math.floor(
        (Date.now() - new Date(ultima.data_venda).getTime()) / 86_400_000,
      );
    } else {
      diasInativo = 999;
    }
  }

  const check = validarCupom(
    {
      tipo: cupom.tipo as never,
      discountPercent: cupom.discount_percent,
      discountAmount: cupom.discount_amount,
      minOrderAmount: Number(cupom.min_order_amount),
      maxUses: cupom.max_uses,
      usesCount: cupom.uses_count,
      maxUsesPerCustomer: cupom.max_uses_per_customer,
      customerUses,
      startsAt: cupom.starts_at,
      endsAt: cupom.ends_at,
      active: cupom.active,
      primeiraCompra,
      isAniversario,
      diasInativo,
    },
    parsed.data.orderAmount,
  );
  if (!check.ok) throw new Error(check.motivo);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("coupon_redemptions").insert({
    empresa_id: empresa.id,
    coupon_id: cupom.id,
    cliente_id: parsed.data.clienteId ?? null,
    pedido_id: parsed.data.pedidoId ?? null,
    discount_applied: check.desconto,
    created_by: user?.id,
  });

  await supabase
    .from("coupons")
    .update({ uses_count: cupom.uses_count + 1 })
    .eq("id", cupom.id);

  revalidarCrm();
  return { desconto: check.desconto };
}

export async function criarCampanha(input: unknown): Promise<string> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const parsed = campanhaSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const status = parsed.data.scheduledAt ? "agendada" : "rascunho";
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      empresa_id: empresa.id,
      name: parsed.data.name,
      channel: parsed.data.channel,
      segment_key: parsed.data.segmentKey ?? null,
      template_body: parsed.data.templateBody,
      template_name: parsed.data.templateName ?? null,
      scheduled_at: parsed.data.scheduledAt ?? null,
      automation_type: parsed.data.automationType ?? "manual",
      status,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Não foi possível criar a campanha.");

  void registrarAuditoria({
    acao: "criar",
    entidade: "marketing_campaigns",
    registroId: data.id,
    valorNovo: parsed.data,
  });
  revalidarCrm();
  return data.id;
}

export async function dispararCampanha(campaignId: string): Promise<{
  enviados: number;
  falhas: number;
  ignorados: number;
}> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error || !campaign) throw new Error("Campanha não encontrada.");

  const segmentos = await avaliarSegmentos();
  const alvoIds = campaign.segment_key
    ? (segmentos[campaign.segment_key as keyof typeof segmentos] ?? [])
    : Object.values(segmentos).flat();
  const uniqueIds = [...new Set(alvoIds)];

  if (uniqueIds.length === 0) {
    throw new Error("Nenhum cliente no público-alvo.");
  }

  await supabase
    .from("marketing_campaigns")
    .update({ status: "enviando" })
    .eq("id", campaignId);

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, telefone, email")
    .eq("empresa_id", empresa.id)
    .in("id", uniqueIds);

  const { data: perfis } = await supabase
    .from("customers_profiles")
    .select("cliente_id, consent_whatsapp, consent_email, consent_sms, consent_push")
    .eq("empresa_id", empresa.id)
    .in("cliente_id", uniqueIds);

  const consentMap = new Map((perfis ?? []).map((p) => [p.cliente_id, p]));

  let enviados = 0;
  let falhas = 0;
  let ignorados = 0;

  for (const cliente of clientes ?? []) {
    const consent = consentMap.get(cliente.id);
    const consentOk =
      campaign.channel === "whatsapp"
        ? Boolean(consent?.consent_whatsapp)
        : campaign.channel === "email"
          ? Boolean(consent?.consent_email)
          : campaign.channel === "sms"
            ? Boolean(consent?.consent_sms)
            : Boolean(consent?.consent_push);

    const to =
      campaign.channel === "email" ? cliente.email : cliente.telefone;

    await supabase.from("campaign_recipients").upsert(
      {
        empresa_id: empresa.id,
        campaign_id: campaignId,
        cliente_id: cliente.id,
        status: "pendente",
      },
      { onConflict: "campaign_id,cliente_id" },
    );

    const result = await enviarComunicacaoCliente({
      empresaId: empresa.id,
      clienteId: cliente.id,
      channel: campaign.channel as "whatsapp" | "email" | "sms" | "push",
      to,
      body: campaign.template_body,
      vars: { nome: cliente.nome },
      campaignId,
      consentOk,
      providerId: "whatsapp_cloud",
    });

    const status =
      result.status === "sent" || result.status === "queued"
        ? "enviado"
        : result.status === "skipped"
          ? "ignorado"
          : "falha";

    if (status === "enviado") enviados += 1;
    else if (status === "ignorado") ignorados += 1;
    else falhas += 1;

    await supabase
      .from("campaign_recipients")
      .update({
        status,
        error_message: result.error ?? null,
        sent_at: status === "enviado" ? new Date().toISOString() : null,
      })
      .eq("campaign_id", campaignId)
      .eq("cliente_id", cliente.id);
  }

  await supabase
    .from("marketing_campaigns")
    .update({
      status: falhas > 0 && enviados === 0 ? "falha" : "enviada",
      sent_at: new Date().toISOString(),
      metrics: { enviados, falhas, ignorados, total: uniqueIds.length },
    })
    .eq("id", campaignId);

  void registrarAuditoria({
    acao: "outro",
    entidade: "marketing_campaigns",
    registroId: campaignId,
    metadados: { enviados, falhas, ignorados },
  });

  revalidarCrm();
  return { enviados, falhas, ignorados };
}

export async function atualizarContagemSegmentos(): Promise<number> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  await garantirCrmDefaults();
  const segs = await avaliarSegmentos();
  const supabase = await createClient();
  let total = 0;
  for (const [key, ids] of Object.entries(segs)) {
    await supabase
      .from("customer_segments")
      .update({
        member_count: ids.length,
        last_evaluated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresa.id)
      .eq("key", key);
    total += ids.length;
  }
  revalidarCrm();
  return total;
}
