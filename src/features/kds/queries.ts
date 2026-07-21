import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { calcularTemposMedios } from "./metrics";
import type { SetorKds } from "./status";

export type PedidoItemKds = Pick<
  Tables<"pedido_itens">,
  | "id"
  | "quantidade"
  | "observacao"
  | "status_preparo"
  | "preparo_iniciado_em"
  | "pronto_em"
> & {
  fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome" | "praca_producao_id"> & {
    praca_setor?: string | null;
  };
};

export type PedidoParaKds = Pick<
  Tables<"pedidos">,
  "id" | "numero" | "tipo" | "status" | "confirmado_em" | "criado_em" | "observacoes"
> & {
  pedido_itens: PedidoItemKds[];
};

export type PracaProducaoKds = Tables<"pracas_producao"> & {
  setor: SetorKds | string;
};

export type KdsConfig = {
  empresa_id: string;
  alerta_atraso_minutos: number;
  alerta_sonoro: boolean;
  impressao_automatica: boolean;
  prioridade_entrega_boost: number;
};

export type KdsEvento = Tables<"kds_events">;

const PEDIDO_SELECT =
  "id, numero, tipo, status, confirmado_em, criado_em, observacoes, pedido_itens(id, quantidade, observacao, status_preparo, preparo_iniciado_em, pronto_em, fichas_tecnicas(id, nome, praca_producao_id))";

const PEDIDO_SELECT_LEGACY =
  "id, numero, tipo, status, confirmado_em, criado_em, observacoes, pedido_itens(id, quantidade, observacao, status_preparo, fichas_tecnicas(id, nome, praca_producao_id))";

/** Pedidos em produção + recentemente expedidos (para coluna Expedido no board). */
export async function listarPedidosParaKds(): Promise<PedidoParaKds[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  let data: unknown = null;
  let error: { message: string } | null = null;

  const primary = await supabase
    .from("pedidos")
    .select(PEDIDO_SELECT)
    .eq("empresa_id", empresa.id)
    .in("status", ["confirmado", "em_preparo", "pronto", "saiu_para_entrega"])
    .order("criado_em", { ascending: true });

  data = primary.data;
  error = primary.error;

  if (error) {
    const fallback = await supabase
      .from("pedidos")
      .select(PEDIDO_SELECT_LEGACY)
      .eq("empresa_id", empresa.id)
      .in("status", ["confirmado", "em_preparo", "pronto"])
      .order("criado_em", { ascending: true });
    if (fallback.error) throw fallback.error;
    data = (fallback.data ?? []).map((pedido) => ({
      ...pedido,
      pedido_itens: (
        (pedido as { pedido_itens: Array<Record<string, unknown>> }).pedido_itens ?? []
      ).map((item) => ({
        ...item,
        preparo_iniciado_em: null,
        pronto_em: null,
      })),
    }));
  }

  const pedidos = data as PedidoParaKds[];
  const pracas = await listarPracasProducao();
  const setorPorPraca = new Map(pracas.map((p) => [p.id, p.setor]));

  return pedidos.map((pedido) => ({
    ...pedido,
    pedido_itens: pedido.pedido_itens.map((item) => ({
      ...item,
      preparo_iniciado_em: item.preparo_iniciado_em ?? null,
      pronto_em: item.pronto_em ?? null,
      fichas_tecnicas: {
        ...item.fichas_tecnicas,
        praca_setor: item.fichas_tecnicas.praca_producao_id
          ? (setorPorPraca.get(item.fichas_tecnicas.praca_producao_id) ?? "cozinha")
          : "cozinha",
      },
    })),
  }));
}

export async function listarPracasProducao(): Promise<PracaProducaoKds[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pracas_producao")
    .select("*")
    .or(`empresa_id.eq.${empresa.id},empresa_id.is.null`)
    .eq("ativo", true)
    .order("ordem_exibicao", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    setor: (p as { setor?: string }).setor ?? "cozinha",
  })) as PracaProducaoKds[];
}

export async function obterConfigKds(): Promise<KdsConfig> {
  const empresa = await getEmpresaAtual();
  const defaults: KdsConfig = {
    empresa_id: empresa?.id ?? "",
    alerta_atraso_minutos: 15,
    alerta_sonoro: true,
    impressao_automatica: true,
    prioridade_entrega_boost: 10,
  };
  if (!empresa) return defaults;

  const supabase = await createClient();
  try {
    await supabase.rpc("fn_seed_kds_config", { p_empresa_id: empresa.id });
  } catch {
    return { ...defaults, empresa_id: empresa.id };
  }

  const { data, error } = await supabase
    .from("kds_config")
    .select(
      "empresa_id, alerta_atraso_minutos, alerta_sonoro, impressao_automatica, prioridade_entrega_boost",
    )
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (error || !data) return { ...defaults, empresa_id: empresa.id };
  return data as KdsConfig;
}

export async function listarEventosKds(limite = 40): Promise<KdsEvento[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kds_events")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: false })
    .limit(limite);

  if (error) {
    // Tabela ainda não aplicada no ambiente local — KDS continua sem histórico.
    if (error.message.includes("kds_events") || error.code === "42P01") return [];
    throw error;
  }
  return data as KdsEvento[];
}

/** Amostra de pedidos recentes concluídos para tempo médio. */
export async function obterMetricasKds(): Promise<{
  tempoMedioItemSegundos: number | null;
  tempoMedioPedidoSegundos: number | null;
  itensAmostrados: number;
  pedidosAmostrados: number;
}> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      tempoMedioItemSegundos: null,
      tempoMedioPedidoSegundos: null,
      itensAmostrados: 0,
      pedidosAmostrados: 0,
    };
  }

  const supabase = await createClient();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("pedidos")
    .select(
      "confirmado_em, criado_em, pedido_itens(preparo_iniciado_em, pronto_em)",
    )
    .eq("empresa_id", empresa.id)
    .in("status", ["pronto", "saiu_para_entrega", "entregue"])
    .gte("criado_em", desde)
    .limit(80);

  if (error) {
    return {
      tempoMedioItemSegundos: null,
      tempoMedioPedidoSegundos: null,
      itensAmostrados: 0,
      pedidosAmostrados: 0,
    };
  }

  return calcularTemposMedios(
    (data ?? []) as unknown as Parameters<typeof calcularTemposMedios>[0],
  );
}
