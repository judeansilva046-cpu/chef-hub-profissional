import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requireGestaoObservabilidade } from "@/server/observabilidade/require-gestao";
import { sincronizarAlertasOperacionais } from "@/server/observabilidade/alerts";
import { getObservabilityMetrics } from "@/server/observabilidade/metrics";
import { runSystemHealthCheck } from "@/server/observabilidade/health";

import { filtrarPorEmpresaId } from "./permissions";
import { montarTimeline, type TimelineItem } from "./timeline";

export type AuditEventRow = {
  id: string;
  empresa_id: string | null;
  usuario_id: string | null;
  papel: string | null;
  acao: string;
  entidade: string;
  registro_id: string | null;
  valor_anterior: unknown;
  valor_novo: unknown;
  ip: string | null;
  user_agent: string | null;
  metadados: Record<string, unknown>;
  criado_em: string;
};

export type SystemLogRow = {
  id: string;
  empresa_id: string | null;
  nivel: string;
  modulo: string;
  mensagem: string;
  detalhes: Record<string, unknown>;
  usuario_id: string | null;
  duracao_ms: number | null;
  criado_em: string;
};

export type SystemAlertRow = {
  id: string;
  empresa_id: string;
  tipo: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  entidade: string | null;
  registro_id: string | null;
  resolvido: boolean;
  criado_em: string;
};

export async function listarAuditoria(opts?: {
  limit?: number;
  entidade?: string;
  registroId?: string;
}): Promise<AuditEventRow[]> {
  await requireGestaoObservabilidade();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  let q = supabase
    .from("auditoria_eventos")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.entidade) q = q.eq("entidade", opts.entidade);
  if (opts?.registroId) q = q.eq("registro_id", opts.registroId);

  const { data, error } = await q;
  if (error) throw error;

  return filtrarPorEmpresaId(
    (data ?? []) as AuditEventRow[],
    empresa.id,
  );
}

export async function timelinePedido(pedidoId: string): Promise<TimelineItem[]> {
  const eventos = await listarAuditoria({
    entidade: "pedidos",
    registroId: pedidoId,
    limit: 50,
  });

  // Complementa com histórico nativo de status (já existente)
  await requireGestaoObservabilidade();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();
  const { data: hist } = await supabase
    .from("pedido_status_historico")
    .select("id, status_novo, status_anterior, criado_em")
    .eq("empresa_id", empresa.id)
    .eq("pedido_id", pedidoId)
    .order("criado_em", { ascending: true });

  const fromAudit = montarTimeline(
    eventos.map((e) => ({
      id: e.id,
      acao: e.acao,
      entidade: e.entidade,
      valor_novo: e.valor_novo,
      criado_em: e.criado_em,
      papel: e.papel,
      metadados: e.metadados,
    })),
  );

  const fromHist = (hist ?? []).map((h) => ({
    id: h.id,
    titulo: montarTimeline([
      {
        id: h.id,
        acao: "status",
        entidade: "pedidos",
        valor_novo: { status: h.status_novo },
        criado_em: h.criado_em,
      },
    ])[0]!.titulo,
    descricao: h.status_anterior
      ? `${h.status_anterior} → ${h.status_novo}`
      : h.status_novo,
    criadoEm: h.criado_em,
    acao: "status",
    entidade: "pedidos",
    papel: null as string | null,
  }));

  const merged = [...fromHist, ...fromAudit].sort(
    (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
  );
  return merged;
}

export async function listarLogs(opts?: {
  limit?: number;
  nivel?: string;
}): Promise<SystemLogRow[]> {
  await requireGestaoObservabilidade();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  let q = supabase
    .from("system_logs")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.nivel) q = q.eq("nivel", opts.nivel);

  const { data, error } = await q;
  if (error) throw error;

  return filtrarPorEmpresaId((data ?? []) as SystemLogRow[], empresa.id);
}

export async function listarAlertas(opts?: {
  abertos?: boolean;
  limit?: number;
}): Promise<SystemAlertRow[]> {
  await requireGestaoObservabilidade();
  const empresa = await requireEmpresaAtual();
  const supabase = await createClient();

  let q = supabase
    .from("system_alerts")
    .select(
      "id, empresa_id, tipo, severidade, titulo, mensagem, entidade, registro_id, resolvido, criado_em",
    )
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.abertos !== false) q = q.eq("resolvido", false);

  const { data, error } = await q;
  if (error) throw error;

  return filtrarPorEmpresaId((data ?? []) as SystemAlertRow[], empresa.id);
}

export async function carregarPainelObservabilidade() {
  await requireGestaoObservabilidade();
  const empresa = await requireEmpresaAtual();

  // Sincroniza alertas antes de carregar (best-effort)
  try {
    await sincronizarAlertasOperacionais();
  } catch {
    /* ignore */
  }

  const [auditoria, logs, alertas, metrics, health, performance] =
    await Promise.all([
      listarAuditoria({ limit: 40 }),
      listarLogs({ limit: 40 }),
      listarAlertas({ abertos: true, limit: 30 }),
      getObservabilityMetrics(),
      runSystemHealthCheck(),
      (async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from("performance_samples")
          .select("id, tipo, nome, duracao_ms, criado_em, empresa_id")
          .eq("empresa_id", empresa.id)
          .order("criado_em", { ascending: false })
          .limit(20);
        return filtrarPorEmpresaId(data ?? [], empresa.id);
      })(),
    ]);

  return {
    empresaId: empresa.id,
    auditoria,
    logs,
    alertas,
    metrics,
    health,
    performance,
    activity: montarTimeline(
      auditoria.map((e) => ({
        id: e.id,
        acao: e.acao,
        entidade: e.entidade,
        valor_novo: e.valor_novo,
        criado_em: e.criado_em,
        papel: e.papel,
        metadados: e.metadados,
      })),
    ).slice(0, 20),
  };
}
