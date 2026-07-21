"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requirePapel } from "@/server/auth/require-papel";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";

import { carregarDashboardEstoqueInteligente, montarContextoIaCompras } from "./queries";
import { responderIaCompras, type RespostaIaCompras } from "./ia";
import {
  horizonteSchema,
  inventarioInteligenteSchema,
  perguntaIaSchema,
  perdaSchema,
} from "./validation";

function revalidar() {
  revalidatePath("/estoque");
  revalidatePath("/estoque/inteligente");
  revalidatePath("/estoque/perdas");
  revalidatePath("/estoque/sugestoes");
  revalidatePath("/lista-compras");
}

export async function registrarPerdaEstoque(input: unknown): Promise<string> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const parsed = perdaSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_registrar_perda_estoque", {
    p_empresa_id: empresa.id,
    p_ingrediente_id: parsed.data.ingredienteId,
    p_quantity: parsed.data.quantity,
    p_reason: parsed.data.reason,
    p_notes: parsed.data.notes ?? undefined,
    p_estoque_lote_id: parsed.data.estoqueLoteId ?? undefined,
    p_batch_id: parsed.data.batchId ?? undefined,
    p_lost_at: parsed.data.lostAt ?? undefined,
  });

  if (error) {
    throw new Error(
      error.message.includes("Quantidade") || error.message.includes("estoque")
        ? error.message
        : "Não foi possível registrar a perda.",
    );
  }

  void registrarAuditoria({
    acao: "criar",
    entidade: "inventory_losses",
    registroId: data as string,
    valorNovo: parsed.data,
  });

  revalidar();
  return data as string;
}

export async function gerarSugestoesCompra(input?: unknown): Promise<number> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const opts = horizonteSchema.safeParse(input ?? {});
  const horizonteDias = opts.success ? opts.data.horizonteDias : 7;
  const diasHistorico = opts.success ? opts.data.diasHistorico : 30;

  const dash = await carregarDashboardEstoqueInteligente({ horizonteDias, diasHistorico });
  const supabase = await createClient();

  // Expira sugestões abertas anteriores geradas automaticamente.
  await supabase
    .from("purchase_suggestions")
    .update({ status: "expirada" })
    .eq("empresa_id", empresa.id)
    .eq("status", "aberta")
    .eq("source", "auto");

  const rows = dash.previsoes
    .filter((p) => p.quantidadeSugerida > 0)
    .map((p) => ({
      empresa_id: empresa.id,
      ingrediente_id: p.ingredienteId,
      fornecedor_id: p.fornecedorId,
      suggested_qty: p.quantidadeSugerida,
      unit_price: p.precoUnitario,
      estimated_total:
        p.precoUnitario != null ? p.precoUnitario * p.quantidadeSugerida : null,
      buy_by: p.comprarAte,
      priority: p.prioridade,
      reason: p.motivo,
      status: "aberta" as const,
      stock_on_hand: p.estoqueAtual,
      avg_daily_consumption: p.consumoDiario,
      days_of_cover: p.diasCobertura,
      source: "auto" as const,
      metadata: {
        horizonteDias: p.horizonteDias,
        sazonalidade: p.fatorSazonalidade,
      },
    }));

  if (rows.length === 0) {
    revalidar();
    return 0;
  }

  const { error } = await supabase.from("purchase_suggestions").insert(rows);
  if (error) throw new Error("Não foi possível gerar sugestões de compra.");

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - diasHistorico * 86_400_000);
  const forecastEnd = new Date(periodEnd.getTime() + horizonteDias * 86_400_000);

  await supabase.from("inventory_forecasts").upsert(
    dash.previsoes.map((p) => ({
      empresa_id: empresa.id,
      ingrediente_id: p.ingredienteId,
      horizon_days: horizonteDias,
      forecast_qty: p.quantidadeSugerida + p.estoqueAtual,
      avg_daily_qty: p.consumoDiario,
      seasonality_factor: p.fatorSazonalidade,
      method: "hibrido" as const,
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: forecastEnd.toISOString().slice(0, 10),
      confidence: p.consumoDiario > 0 ? 70 : 40,
      metadata: { motivo: p.motivo, prioridade: p.prioridade },
    })),
    { onConflict: "empresa_id,ingrediente_id,period_start,period_end,method" },
  );

  await supabase.from("inventory_analytics").upsert(
    {
      empresa_id: empresa.id,
      metric_date: new Date().toISOString().slice(0, 10),
      metric_type: "dashboard",
      payload: {
        alertas: dash.alertas.length,
        sugestoes: rows.length,
        cmv: { ...dash.cmv },
        valorParado: dash.valorParado,
        economiaEstimada: dash.economiaEstimada,
        classeA: dash.resumo.classeA,
      } as unknown as Json,
    },
    { onConflict: "empresa_id,metric_date,metric_type" },
  );

  void registrarAuditoria({
    acao: "criar",
    entidade: "purchase_suggestions",
    metadados: { quantidade: rows.length, horizonteDias },
  });

  revalidar();
  return rows.length;
}

export async function criarInventarioInteligente(input: unknown): Promise<string> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const parsed = inventarioInteligenteSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  if (parsed.data.tipo === "setor" && !parsed.data.setor?.trim()) {
    throw new Error("Informe o setor do inventário.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inventario, error: erroInv } = await supabase
    .from("estoque_inventarios")
    .insert({
      empresa_id: empresa.id,
      nome: parsed.data.name,
      tipo: parsed.data.tipo,
      setor: parsed.data.setor ?? null,
      criado_por: user?.id,
    })
    .select("id")
    .single();

  if (erroInv || !inventario) {
    throw new Error("Não foi possível criar o inventário.");
  }

  const { data: count, error: erroCount } = await supabase
    .from("inventory_counts")
    .insert({
      empresa_id: empresa.id,
      name: parsed.data.name,
      tipo: parsed.data.tipo,
      setor: parsed.data.setor ?? null,
      estoque_inventario_id: inventario.id,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (erroCount || !count) {
    throw new Error("Não foi possível criar a contagem inteligente.");
  }

  let query = supabase
    .from("ingredientes")
    .select("id, estoque_saldos(quantidade_total, custo_medio_ponderado)")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true);

  if (parsed.data.ingredienteIds?.length) {
    query = query.in("id", parsed.data.ingredienteIds);
  }

  const { data: ings } = await query;
  const items = (ings ?? []).map((ing) => {
    const saldo = Array.isArray(ing.estoque_saldos) ? ing.estoque_saldos[0] : ing.estoque_saldos;
    return {
      count_id: count.id,
      empresa_id: empresa.id,
      ingrediente_id: ing.id,
      system_qty: saldo?.quantidade_total ?? 0,
      unit_cost: saldo?.custo_medio_ponderado ?? 0,
    };
  });

  if (items.length > 0) {
    const { error } = await supabase.from("inventory_count_items").insert(items);
    if (error) throw new Error("Não foi possível montar os itens da contagem.");
  }

  void registrarAuditoria({
    acao: "criar",
    entidade: "inventory_counts",
    registroId: count.id,
    valorNovo: parsed.data,
  });

  revalidar();
  revalidatePath(`/estoque/inventarios/${inventario.id}`);
  return inventario.id;
}

export async function perguntarIaCompras(input: unknown): Promise<RespostaIaCompras> {
  await requirePapel();
  const parsed = perguntaIaSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Pergunta inválida.");
  }

  const ctx = await montarContextoIaCompras();
  const resposta = responderIaCompras(parsed.data.pergunta, ctx);

  void registrarAuditoria({
    acao: "outro",
    entidade: "inventory_analytics",
    metadados: { origem: "ia_compras", intencao: resposta.intencao },
  });

  return resposta;
}

export async function atualizarStatusSugestao(
  id: string,
  status: "aceita" | "rejeitada" | "comprada",
): Promise<void> {
  await requirePapel();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_suggestions")
    .update({ status })
    .eq("id", id)
    .eq("empresa_id", empresa.id);

  if (error) throw new Error("Não foi possível atualizar a sugestão.");

  void registrarAuditoria({
    acao: "status",
    entidade: "purchase_suggestions",
    registroId: id,
    valorNovo: { status },
  });

  revalidar();
}
