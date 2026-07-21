import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

export type TipoAlerta =
  | "estoque_zerado"
  | "estoque_critico"
  | "pedido_parado"
  | "falha_pagamento"
  | "erro_integracao"
  | "falha_impressao"
  | "erro_banco"
  | "rpc_lenta"
  | "api_lenta";

export async function criarAlerta(input: {
  tipo: TipoAlerta | string;
  severidade: "info" | "warning" | "error" | "critical";
  titulo: string;
  mensagem: string;
  entidade?: string;
  registroId?: string;
  metadados?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const empresa = await requireEmpresaAtual();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("system_alerts")
      .insert({
        empresa_id: empresa.id,
        tipo: input.tipo,
        severidade: input.severidade,
        titulo: input.titulo,
        mensagem: input.mensagem,
        entidade: input.entidade ?? null,
        registro_id: input.registroId ?? null,
        metadados: (input.metadados ?? {}) as never,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[alerts]", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.error("[alerts]", error);
    return null;
  }
}

/**
 * Varre sinais operacionais e abre alertas idempotentes (por tipo+registro no dia).
 */
export async function sincronizarAlertasOperacionais(): Promise<number> {
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  let criados = 0;

  const { data: saldos } = await supabase
    .from("estoque_saldos")
    .select("ingrediente_id, quantidade_total, ingredientes(nome, estoque_minimo)")
    .eq("empresa_id", empresa.id);

  for (const saldo of saldos ?? []) {
    const ing = saldo.ingredientes as unknown as {
      nome: string;
      estoque_minimo: number | null;
    } | null;
    const qtd = Number(saldo.quantidade_total);
    const min = Number(ing?.estoque_minimo ?? 0);
    if (qtd <= 0) {
      const ok = await inserirSeNovo(empresa.id, {
        tipo: "estoque_zerado",
        severidade: "critical",
        titulo: "Estoque zerado",
        mensagem: `${ing?.nome ?? "Ingrediente"} sem saldo.`,
        entidade: "ingredientes",
        registroId: saldo.ingrediente_id,
      });
      if (ok) criados += 1;
    } else if (min > 0 && qtd < min) {
      const ok = await inserirSeNovo(empresa.id, {
        tipo: "estoque_critico",
        severidade: "warning",
        titulo: "Estoque crítico",
        mensagem: `${ing?.nome ?? "Ingrediente"} abaixo do mínimo (${qtd}/${min}).`,
        entidade: "ingredientes",
        registroId: saldo.ingrediente_id,
      });
      if (ok) criados += 1;
    }
  }

  const limite = new Date(Date.now() - 45 * 60_000).toISOString();
  const { data: parados } = await supabase
    .from("pedidos")
    .select("id, numero, status, confirmado_em")
    .eq("empresa_id", empresa.id)
    .eq("status", "em_preparo")
    .lt("confirmado_em", limite);

  for (const pedido of parados ?? []) {
    const ok = await inserirSeNovo(empresa.id, {
      tipo: "pedido_parado",
      severidade: "warning",
      titulo: "Pedido parado na cozinha",
      mensagem: `Pedido #${pedido.numero} em preparo há mais de 45 minutos.`,
      entidade: "pedidos",
      registroId: pedido.id,
    });
    if (ok) criados += 1;
  }

  const desde = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count: errosIntegracao } = await supabase
    .from("integracoes_logs_sincronizacao")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .eq("status", "erro")
    .gte("criado_em", desde);

  if ((errosIntegracao ?? 0) > 0) {
    const ok = await inserirSeNovo(empresa.id, {
      tipo: "erro_integracao",
      severidade: "error",
      titulo: "Falhas de integração",
      mensagem: `${errosIntegracao} erro(s) de sincronização na última hora.`,
      entidade: "integracoes",
    });
    if (ok) criados += 1;
  }

  const { count: falhasImpressao } = await supabase
    .from("fila_impressao")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .eq("status", "erro");

  if ((falhasImpressao ?? 0) > 0) {
    const ok = await inserirSeNovo(empresa.id, {
      tipo: "falha_impressao",
      severidade: "error",
      titulo: "Falhas na fila de impressão",
      mensagem: `${falhasImpressao} trabalho(s) com erro.`,
      entidade: "fila_impressao",
    });
    if (ok) criados += 1;
  }

  const dia = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count: lentas } = await supabase
    .from("performance_samples")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .gte("duracao_ms", 300)
    .gte("criado_em", dia);

  if ((lentas ?? 0) >= 5) {
    const ok = await inserirSeNovo(empresa.id, {
      tipo: "api_lenta",
      severidade: "warning",
      titulo: "Performance degradada",
      mensagem: `${lentas} amostras lentas (≥300ms) nas últimas 24h.`,
      entidade: "performance",
    });
    if (ok) criados += 1;
  }

  const { count: rpcs } = await supabase
    .from("performance_samples")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .eq("tipo", "rpc")
    .gte("duracao_ms", 300)
    .gte("criado_em", dia);

  if ((rpcs ?? 0) >= 3) {
    const ok = await inserirSeNovo(empresa.id, {
      tipo: "rpc_lenta",
      severidade: "warning",
      titulo: "RPCs lentas",
      mensagem: `${rpcs} RPC(s) acima de 300ms nas últimas 24h.`,
      entidade: "performance",
    });
    if (ok) criados += 1;
  }

  return criados;
}

export async function resolverAlerta(alertaId: string): Promise<boolean> {
  try {
    const empresa = await requireEmpresaAtual();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("system_alerts")
      .update({
        resolvido: true,
        resolvido_em: new Date().toISOString(),
        resolvido_por: user?.id ?? null,
      })
      .eq("id", alertaId)
      .eq("empresa_id", empresa.id)
      .eq("resolvido", false);

    return !error;
  } catch {
    return false;
  }
}

async function inserirSeNovo(
  empresaId: string,
  input: {
    tipo: string;
    severidade: "info" | "warning" | "error" | "critical";
    titulo: string;
    mensagem: string;
    entidade?: string;
    registroId?: string;
  },
): Promise<boolean> {
  const supabase = await createClient();
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  let q = supabase
    .from("system_alerts")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("tipo", input.tipo)
    .eq("resolvido", false)
    .gte("criado_em", inicioDia.toISOString())
    .limit(1);

  if (input.registroId) {
    q = q.eq("registro_id", input.registroId);
  }

  const { data: existentes } = await q.maybeSingle();
  if (existentes) return false;

  const { error } = await supabase.from("system_alerts").insert({
    empresa_id: empresaId,
    tipo: input.tipo,
    severidade: input.severidade,
    titulo: input.titulo,
    mensagem: input.mensagem,
    entidade: input.entidade ?? null,
    registro_id: input.registroId ?? null,
  });

  return !error;
}
