import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import {
  agregarConsumoPorDimensao,
  calcularCmvInteligente,
  calcularConsumoMedio,
  calcularGiro,
  classificarCurvaAbc,
  fatorSazonalidade,
  listarAlertas,
  preverCompra,
  valorParadoEmEstoque,
  type AlertaEstoque,
  type ConsumoMedio,
  type CmvInteligente,
  type GiroEstoque,
  type ItemAbc,
  type PrevisaoCompra,
} from "./calculations";
import type { ContextoIaCompras } from "./ia";

const SAIDAS = new Set(["saida", "ajuste_saida", "inventario"]);

export interface DashboardEstoqueInteligente {
  abc: {
    faturamento: ItemAbc[];
    consumo: ItemAbc[];
    margem: ItemAbc[];
    giro: ItemAbc[];
  };
  giros: GiroEstoque[];
  consumos: ConsumoMedio[];
  consumoPorCategoria: ReturnType<typeof agregarConsumoPorDimensao>;
  consumoPorFornecedor: ReturnType<typeof agregarConsumoPorDimensao>;
  previsoes: PrevisaoCompra[];
  alertas: AlertaEstoque[];
  cmv: CmvInteligente;
  perdas: Tables<"inventory_losses">[];
  perdasPorProduto: Array<{ nome: string; quantidade: number; custo: number }>;
  valorParado: number;
  economiaEstimada: number;
  sugestoesAbertas: number;
  batchesAtivos: number;
  resumo: {
    itensAnalisados: number;
    classeA: number;
    coberturaMedia: number | null;
  };
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.max(1, Math.ceil((fim.getTime() - inicio.getTime()) / 86_400_000));
}

export async function carregarDashboardEstoqueInteligente(opts?: {
  diasHistorico?: number;
  horizonteDias?: number;
}): Promise<DashboardEstoqueInteligente> {
  const empresa = await getEmpresaAtual();
  const empty: DashboardEstoqueInteligente = {
    abc: { faturamento: [], consumo: [], margem: [], giro: [] },
    giros: [],
    consumos: [],
    consumoPorCategoria: [],
    consumoPorFornecedor: [],
    previsoes: [],
    alertas: [],
    cmv: {
      estoqueInicialValor: 0,
      comprasValor: 0,
      perdasValor: 0,
      estoqueFinalValor: 0,
      cmv: 0,
      cmvPercentualSobreVendas: null,
    },
    perdas: [],
    perdasPorProduto: [],
    valorParado: 0,
    economiaEstimada: 0,
    sugestoesAbertas: 0,
    batchesAtivos: 0,
    resumo: { itensAnalisados: 0, classeA: 0, coberturaMedia: null },
  };
  if (!empresa) return empty;

  const diasHistorico = opts?.diasHistorico ?? 30;
  const horizonteDias = opts?.horizonteDias ?? 7;
  const fim = new Date();
  const inicio = new Date(fim.getTime() - diasHistorico * 86_400_000);
  const inicio7 = new Date(fim.getTime() - 7 * 86_400_000);
  const inicioIso = inicio.toISOString();
  const inicio7Iso = inicio7.toISOString();

  const supabase = await createClient();

  const [
    ingredientesRes,
    movsRes,
    fornecedorIngRes,
    perdasRes,
    comprasRes,
    vendasRes,
    sugestoesRes,
    batchesRes,
  ] = await Promise.all([
    supabase
      .from("ingredientes")
      .select(
        "id, nome, estoque_minimo, custo_unitario_atual, categoria_id, categorias_ingredientes(id, nome), estoque_saldos(quantidade_total, custo_medio_ponderado)",
      )
      .eq("empresa_id", empresa.id)
      .eq("ativo", true),
    supabase
      .from("estoque_movimentacoes")
      .select("ingrediente_id, tipo, quantidade, custo_unitario, criado_em, referencia_tipo")
      .eq("empresa_id", empresa.id)
      .gte("criado_em", inicioIso),
    supabase
      .from("fornecedor_ingredientes")
      .select("ingrediente_id, fornecedor_id, preco_unitario, fornecedores(id, nome)")
      .eq("empresa_id", empresa.id),
    supabase
      .from("inventory_losses")
      .select("*")
      .eq("empresa_id", empresa.id)
      .gte("lost_at", inicioIso.slice(0, 10))
      .order("lost_at", { ascending: false })
      .limit(200),
    supabase
      .from("estoque_movimentacoes")
      .select("quantidade, custo_unitario")
      .eq("empresa_id", empresa.id)
      .eq("tipo", "entrada")
      .gte("criado_em", inicioIso),
    supabase
      .from("vendas")
      .select("quantidade, preco_unitario_praticado")
      .eq("empresa_id", empresa.id)
      .gte("data_venda", inicioIso.slice(0, 10)),
    supabase
      .from("purchase_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("status", "aberta"),
    supabase
      .from("inventory_batches")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("status", "ativo"),
  ]);

  // Ambiente sem migration 0050: perdas/sugestões/batches podem falhar.
  const perdas = (perdasRes.error ? [] : perdasRes.data ?? []) as Tables<"inventory_losses">[];
  const sugestoesAbertas = sugestoesRes.error ? 0 : (sugestoesRes.count ?? 0);
  const batchesAtivos = batchesRes.error ? 0 : (batchesRes.count ?? 0);

  if (ingredientesRes.error) throw ingredientesRes.error;
  if (movsRes.error) throw movsRes.error;

  type IngRow = {
    id: string;
    nome: string;
    estoque_minimo: number;
    custo_unitario_atual: number;
    categoria_id: string | null;
    categorias_ingredientes: { id: string; nome: string } | { id: string; nome: string }[] | null;
    estoque_saldos:
      | { quantidade_total: number; custo_medio_ponderado: number }
      | { quantidade_total: number; custo_medio_ponderado: number }[]
      | null;
  };

  const ingredientes = (ingredientesRes.data ?? []) as unknown as IngRow[];
  const movs = movsRes.data ?? [];

  const melhorFornecedor = new Map<
    string,
    { fornecedorId: string; fornecedorNome: string; preco: number }
  >();
  for (const row of fornecedorIngRes.data ?? []) {
    const f = row.fornecedores as { id: string; nome: string } | { id: string; nome: string }[] | null;
    const fornecedor = Array.isArray(f) ? f[0] : f;
    if (!fornecedor) continue;
    const preco = Number(row.preco_unitario);
    const atual = melhorFornecedor.get(row.ingrediente_id);
    if (!atual || preco < atual.preco) {
      melhorFornecedor.set(row.ingrediente_id, {
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.nome,
        preco,
      });
    }
  }

  const consumoPorIng = new Map<string, number>();
  const consumo7PorIng = new Map<string, number>();
  for (const m of movs) {
    if (!SAIDAS.has(m.tipo)) continue;
    const q = Number(m.quantidade);
    consumoPorIng.set(m.ingrediente_id, (consumoPorIng.get(m.ingrediente_id) ?? 0) + q);
    if (m.criado_em >= inicio7Iso) {
      consumo7PorIng.set(m.ingrediente_id, (consumo7PorIng.get(m.ingrediente_id) ?? 0) + q);
    }
  }

  const diasPeriodo = diasEntre(inicio, fim);
  const itensBase = ingredientes.map((ing) => {
    const saldo = Array.isArray(ing.estoque_saldos) ? ing.estoque_saldos[0] : ing.estoque_saldos;
    const cat = Array.isArray(ing.categorias_ingredientes)
      ? ing.categorias_ingredientes[0]
      : ing.categorias_ingredientes;
    const forn = melhorFornecedor.get(ing.id);
    const estoqueAtual = saldo?.quantidade_total ?? 0;
    const custoMedio = saldo?.custo_medio_ponderado ?? ing.custo_unitario_atual ?? 0;
    const consumoPeriodo = consumoPorIng.get(ing.id) ?? 0;
    return {
      ingredienteId: ing.id,
      nome: ing.nome,
      categoriaId: cat?.id ?? ing.categoria_id,
      categoriaNome: cat?.nome ?? null,
      fornecedorId: forn?.fornecedorId ?? null,
      fornecedorNome: forn?.fornecedorNome ?? null,
      consumoPeriodo,
      diasPeriodo,
      estoqueAtual,
      estoqueMinimo: ing.estoque_minimo,
      custoMedio,
      faturamento: consumoPeriodo * custoMedio,
      margem: consumoPeriodo * custoMedio * 0.35,
      precoFornecedor: forn?.preco ?? null,
      consumo7d: consumo7PorIng.get(ing.id) ?? 0,
    };
  });

  const consumos = itensBase.map((i) => calcularConsumoMedio(i));
  const giros = itensBase.map((i) =>
    calcularGiro({
      ingredienteId: i.ingredienteId,
      nome: i.nome,
      consumoPeriodo: i.consumoPeriodo,
      diasPeriodo: i.diasPeriodo,
      estoqueAtual: i.estoqueAtual,
    }),
  );

  const abc = {
    faturamento: classificarCurvaAbc(
      itensBase.map((i) => ({
        ingredienteId: i.ingredienteId,
        nome: i.nome,
        valor: i.faturamento,
      })),
    ),
    consumo: classificarCurvaAbc(
      itensBase.map((i) => ({
        ingredienteId: i.ingredienteId,
        nome: i.nome,
        valor: i.consumoPeriodo,
      })),
    ),
    margem: classificarCurvaAbc(
      itensBase.map((i) => ({
        ingredienteId: i.ingredienteId,
        nome: i.nome,
        valor: i.margem,
      })),
    ),
    giro: classificarCurvaAbc(
      giros.map((g) => ({
        ingredienteId: g.ingredienteId,
        nome: g.nome,
        valor: g.giroMensal,
      })),
    ),
  };

  const previsoes = itensBase.map((i) => {
    const consumoDiario = i.consumoPeriodo / diasPeriodo;
    const sazonal = fatorSazonalidade(i.consumo7d, Math.max(0, i.consumoPeriodo - i.consumo7d));
    return preverCompra({
      ingredienteId: i.ingredienteId,
      nome: i.nome,
      estoqueAtual: i.estoqueAtual,
      estoqueMinimo: i.estoqueMinimo,
      consumoDiario,
      horizonteDias,
      fatorSazonalidade: sazonal,
      fornecedorId: i.fornecedorId,
      fornecedorNome: i.fornecedorNome,
      precoUnitario: i.precoFornecedor,
    });
  });

  const alertas = listarAlertas(itensBase);

  const estoqueFinalValor = itensBase.reduce(
    (s, i) => s + i.estoqueAtual * i.custoMedio,
    0,
  );
  const comprasValor = (comprasRes.data ?? []).reduce(
    (s, m) => s + Number(m.quantidade) * Number(m.custo_unitario),
    0,
  );
  const perdasValor = perdas.reduce((s, p) => s + Number(p.quantity) * Number(p.unit_cost), 0);
  // Proxy EI: EF + saídas valor − entradas valor (aproximação no período)
  const saidasValor = movs
    .filter((m) => SAIDAS.has(m.tipo))
    .reduce((s, m) => s + Number(m.quantidade) * Number(m.custo_unitario), 0);
  const estoqueInicialValor = Math.max(0, estoqueFinalValor + saidasValor - comprasValor);

  let vendasValor = 0;
  for (const v of vendasRes.data ?? []) {
    vendasValor += Number(v.quantidade) * Number(v.preco_unitario_praticado);
  }

  const cmv = calcularCmvInteligente({
    estoqueInicialValor,
    comprasValor,
    perdasValor,
    estoqueFinalValor,
    vendasValor,
  });

  const nomePorId = new Map(itensBase.map((i) => [i.ingredienteId, i.nome]));
  const perdasAgg = new Map<string, { nome: string; quantidade: number; custo: number }>();
  for (const p of perdas) {
    const atual = perdasAgg.get(p.ingrediente_id) ?? {
      nome: nomePorId.get(p.ingrediente_id) ?? "Ingrediente",
      quantidade: 0,
      custo: 0,
    };
    atual.quantidade += Number(p.quantity);
    atual.custo += Number(p.quantity) * Number(p.unit_cost);
    perdasAgg.set(p.ingrediente_id, atual);
  }

  const valorParado = valorParadoEmEstoque(itensBase);

  const economiaEstimada = previsoes
    .filter((p) => p.quantidadeSugerida > 0 && p.precoUnitario != null)
    .reduce((s, p) => s + p.quantidadeSugerida * (p.precoUnitario! * 0.05), 0);

  const coberturas = giros
    .map((g) => g.diasCobertura)
    .filter((d): d is number => d != null);
  const coberturaMedia =
    coberturas.length > 0
      ? Math.round((coberturas.reduce((a, b) => a + b, 0) / coberturas.length) * 10) / 10
      : null;

  return {
    abc,
    giros: giros.sort((a, b) => b.giroMensal - a.giroMensal),
    consumos,
    consumoPorCategoria: agregarConsumoPorDimensao(consumos, "categoria"),
    consumoPorFornecedor: agregarConsumoPorDimensao(consumos, "fornecedor"),
    previsoes: previsoes
      .filter((p) => p.quantidadeSugerida > 0 || p.prioridade !== "baixa")
      .sort((a, b) => {
        const rank = { critica: 0, alta: 1, media: 2, baixa: 3 };
        return rank[a.prioridade] - rank[b.prioridade];
      }),
    alertas,
    cmv,
    perdas,
    perdasPorProduto: [...perdasAgg.values()].sort((a, b) => b.custo - a.custo),
    valorParado,
    economiaEstimada: Math.round(economiaEstimada * 100) / 100,
    sugestoesAbertas,
    batchesAtivos,
    resumo: {
      itensAnalisados: itensBase.length,
      classeA: abc.consumo.filter((i) => i.classe === "A").length,
      coberturaMedia,
    },
  };
}

export async function montarContextoIaCompras(): Promise<ContextoIaCompras> {
  const dash = await carregarDashboardEstoqueInteligente();
  const fornecedoresBaratos = dash.previsoes
    .filter((p) => p.fornecedorNome && p.precoUnitario != null)
    .map((p) => ({
      ingredienteNome: p.nome,
      fornecedorNome: p.fornecedorNome!,
      preco: p.precoUnitario!,
    }))
    .sort((a, b) => a.preco - b.preco);

  return {
    previsoes: dash.previsoes,
    giros: dash.giros,
    consumos: dash.consumos,
    alertas: dash.alertas,
    abc: dash.abc.consumo,
    perdasPorProduto: dash.perdasPorProduto,
    valorParado: dash.valorParado,
    fornecedoresBaratos,
  };
}

export async function listarPerdasEstoque(limite = 50): Promise<Tables<"inventory_losses">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_losses")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("lost_at", { ascending: false })
    .limit(limite);
  if (error) return [];
  return data as Tables<"inventory_losses">[];
}

export type SugestaoCompraComNome = Tables<"purchase_suggestions"> & {
  ingredientes?: { nome: string } | null;
};

export async function listarSugestoesCompra(): Promise<SugestaoCompraComNome[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_suggestions")
    .select("*, ingredientes(nome)")
    .eq("empresa_id", empresa.id)
    .eq("status", "aberta")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data as unknown as SugestaoCompraComNome[];
}

export async function listarBatchesInteligentes(): Promise<Tables<"inventory_batches">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) return [];
  return data as Tables<"inventory_batches">[];
}
