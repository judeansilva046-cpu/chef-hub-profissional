import "server-only";

import { analisarVendas } from "@/features/dashboard/calculations";
import {
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
} from "@/features/financeiro/queries";
import { calcularTemposMedios } from "@/features/kds/metrics";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import {
  agregarDrillDown,
  calcularLtv,
  kpisCrm,
  kpisDelivery,
  kpisEstoque,
  kpisFinanceiros,
  kpisOperacao,
  montarComparativo,
  montarProgressoMetas,
  pedidosPorHora,
  taxaRetencao,
  ticketMedio,
} from "./calculations";
import { type Periodo } from "./periods";
import { resolverComparativo } from "./periods";
import type {
  BiComparativoModo,
  BiDashboardId,
  BiDrillLevel,
  BiKpi,
  BiMetaTipo,
} from "./types";

async function resumoVendas(periodo: Periodo) {
  const [vendas, gerais, canais] = await Promise.all([
    buscarVendasPorPeriodo({
      dataInicio: periodo.inicio,
      dataFim: periodo.fim,
    }),
    calcularCustosVariaveisAgregados(),
    listarCanaisVenda(),
  ]);
  const canaisPorId = new Map(
    canais.map((c) => [
      c.id,
      { taxa_percentual: Number(c.taxa_percentual ?? 0), taxa_fixa: Number(c.taxa_fixa ?? 0) },
    ]),
  );
  return { vendas, analise: analisarVendas(vendas, gerais, canaisPorId) };
}

async function fluxoNoPeriodo(periodo: Periodo): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_flow")
    .select("amount, tipo")
    .eq("empresa_id", empresa.id)
    .gte("flow_date", periodo.inicio)
    .lte("flow_date", periodo.fim);
  if (error) return 0;
  return (data ?? []).reduce((s, r) => {
    const tipo = String(r.tipo ?? "").toLowerCase();
    const valor = Number(r.amount ?? 0);
    if (tipo.includes("saida") || tipo.includes("out") || tipo === "expense") {
      return s - Math.abs(valor);
    }
    return s + valor;
  }, 0);
}

async function metricasPedidos(periodo: Periodo, tipo?: string) {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      total: 0,
      cancelados: 0,
      receita: 0,
      tempoEntregaMin: null as number | null,
      tempoAtendimentoMin: null as number | null,
      porCanal: [] as Array<{
        canalId: string | null;
        nome: string;
        receita: number;
        qtd: number;
      }>,
    };
  }
  const supabase = await createClient();
  let q = supabase
    .from("pedidos")
    .select(
      "id, total, status, tipo, cancelado_em, confirmado_em, entregue_em, criado_em, canal_venda_id, canais_venda(id, nome), numero",
    )
    .eq("empresa_id", empresa.id)
    .gte("criado_em", `${periodo.inicio}T00:00:00`)
    .lte("criado_em", `${periodo.fim}T23:59:59`);

  if (tipo) q = q.eq("tipo", tipo);

  const { data } = await q;
  const rows = data ?? [];
  const cancelados = rows.filter(
    (p) => p.cancelado_em || p.status === "cancelado",
  ).length;

  const entregas: number[] = [];
  const atendimentos: number[] = [];
  for (const p of rows) {
    if (p.confirmado_em && p.entregue_em) {
      const min =
        (new Date(p.entregue_em).getTime() - new Date(p.confirmado_em).getTime()) /
        60_000;
      if (min >= 0) entregas.push(min);
    }
    if (p.criado_em && p.confirmado_em) {
      const min =
        (new Date(p.confirmado_em).getTime() - new Date(p.criado_em).getTime()) /
        60_000;
      if (min >= 0) atendimentos.push(min);
    }
  }

  const porCanalMap = new Map<
    string | null,
    { canalId: string | null; nome: string; receita: number; qtd: number }
  >();
  for (const p of rows) {
    if (p.cancelado_em || p.status === "cancelado") continue;
    const canal = p.canais_venda as { id: string; nome: string } | null;
    const key = p.canal_venda_id;
    const atual = porCanalMap.get(key) ?? {
      canalId: key,
      nome: canal?.nome ?? "Sem canal",
      receita: 0,
      qtd: 0,
    };
    atual.receita += Number(p.total ?? 0);
    atual.qtd += 1;
    porCanalMap.set(key, atual);
  }

  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;

  return {
    total: rows.length,
    cancelados,
    receita: rows
      .filter((p) => !p.cancelado_em && p.status !== "cancelado")
      .reduce((s, p) => s + Number(p.total ?? 0), 0),
    tempoEntregaMin: avg(entregas),
    tempoAtendimentoMin: avg(atendimentos),
    porCanal: [...porCanalMap.values()].sort((a, b) => b.receita - a.receita),
  };
}

async function metricasKdsPeriodo(periodo: Periodo) {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      tempoPreparoMin: null as number | null,
      tempoPedidoMin: null as number | null,
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select(
      "confirmado_em, criado_em, pedido_itens(preparo_iniciado_em, pronto_em)",
    )
    .eq("empresa_id", empresa.id)
    .gte("criado_em", `${periodo.inicio}T00:00:00`)
    .lte("criado_em", `${periodo.fim}T23:59:59`)
    .limit(200);

  const tempos = calcularTemposMedios(
    (data ?? []).map((p) => ({
      confirmado_em: p.confirmado_em,
      criado_em: p.criado_em,
      pedido_itens: (p.pedido_itens ?? []) as Array<{
        preparo_iniciado_em: string | null;
        pronto_em: string | null;
      }>,
    })),
  );

  return {
    tempoPreparoMin:
      tempos.tempoMedioItemSegundos != null
        ? Math.round((tempos.tempoMedioItemSegundos / 60) * 10) / 10
        : null,
    tempoPedidoMin:
      tempos.tempoMedioPedidoSegundos != null
        ? Math.round((tempos.tempoMedioPedidoSegundos / 60) * 10) / 10
        : null,
  };
}

async function metricasEstoquePeriodo(periodo: Periodo) {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      perdas: 0,
      giro: null as number | null,
      cobertura: null as number | null,
    };
  }
  const supabase = await createClient();
  let perdas = 0;
  const { data: losses } = await supabase
    .from("inventory_losses")
    .select("total_cost, quantity, unit_cost, lost_at")
    .eq("empresa_id", empresa.id)
    .gte("lost_at", periodo.inicio)
    .lte("lost_at", `${periodo.fim}T23:59:59`);

  perdas = (losses ?? []).reduce((s, r) => {
    const total =
      r.total_cost != null
        ? Number(r.total_cost)
        : Number(r.unit_cost ?? 0) * Number(r.quantity ?? 0);
    return s + total;
  }, 0);

  let giro: number | null = null;
  let cobertura: number | null = null;
  const { data } = await supabase
    .from("inventory_analytics")
    .select("payload")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = (data?.payload ?? {}) as Record<string, unknown>;
  if (typeof payload.giro_medio === "number") giro = payload.giro_medio;
  if (typeof payload.cobertura_dias === "number") cobertura = payload.cobertura_dias;
  if (typeof payload.avgTurnover === "number") giro = payload.avgTurnover;
  if (typeof payload.coverageDays === "number") cobertura = payload.coverageDays;

  return { perdas, giro, cobertura };
}

async function metricasCrmPeriodo(periodo: Periodo) {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      ticket: null as number | null,
      frequencia: null as number | null,
      retencao: null as number | null,
      ltv: 0,
      ativos: 0,
    };
  }
  const supabase = await createClient();
  const { data: vendas } = await supabase
    .from("vendas")
    .select("cliente_id, valor_total, data_venda")
    .eq("empresa_id", empresa.id)
    .gte("data_venda", periodo.inicio)
    .lte("data_venda", periodo.fim)
    .not("cliente_id", "is", null);

  const porCliente = new Map<string, { gasto: number; compras: number }>();
  for (const v of vendas ?? []) {
    if (!v.cliente_id) continue;
    const a = porCliente.get(v.cliente_id) ?? { gasto: 0, compras: 0 };
    a.gasto += Number(v.valor_total ?? 0);
    a.compras += 1;
    porCliente.set(v.cliente_id, a);
  }

  const clientes = [...porCliente.values()];
  const receita = clientes.reduce((s, c) => s + c.gasto, 0);
  const compras = clientes.reduce((s, c) => s + c.compras, 0);
  const ticket = ticketMedio(receita, compras);
  const frequencia =
    clientes.length > 0
      ? Math.round((compras / clientes.length) * 100) / 100
      : null;
  const recorrentes = clientes.filter((c) => c.compras >= 2).length;
  const retencao = taxaRetencao(recorrentes, clientes.length);
  const ltv = calcularLtv({
    ticketMedio: ticket ?? 0,
    frequenciaMensal: frequencia ?? 0,
    horizonteMeses: 12,
  });

  const corteAtivo = new Date();
  corteAtivo.setDate(corteAtivo.getDate() - 60);
  const corteIso = corteAtivo.toISOString().slice(0, 10);
  const { count } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa.id)
    .gte("atualizado_em", `${corteIso}T00:00:00`);

  return {
    ticket,
    frequencia,
    retencao,
    ltv,
    ativos: count ?? clientes.length,
  };
}

async function metricasFuncionarios() {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      ativos: 0,
      custoMensal: 0,
      porCargo: [] as Array<{ cargo: string; qtd: number }>,
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("funcionarios")
    .select("id, ativo, cargo, salario_bruto, beneficios_mensais, percentual_encargos")
    .eq("empresa_id", empresa.id);

  const rows = data ?? [];
  const ativos = rows.filter((f) => f.ativo !== false);
  const porCargoMap = new Map<string, number>();
  for (const f of ativos) {
    const cargo = f.cargo ?? "Sem cargo";
    porCargoMap.set(cargo, (porCargoMap.get(cargo) ?? 0) + 1);
  }

  return {
    ativos: ativos.length,
    custoMensal: ativos.reduce((s, f) => {
      const bruto = Number(f.salario_bruto ?? 0);
      const beneficios = Number(f.beneficios_mensais ?? 0);
      const encargos = bruto * (Number(f.percentual_encargos ?? 0) / 100);
      return s + bruto + beneficios + encargos;
    }, 0),
    porCargo: [...porCargoMap.entries()].map(([cargo, qtd]) => ({ cargo, qtd })),
  };
}

export async function listarBiMetas(periodo?: Periodo) {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];
  const supabase = await createClient();
  let q = supabase
    .from("bi_metas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("periodo_inicio", { ascending: false });

  if (periodo) {
    q = q.lte("periodo_inicio", periodo.fim).gte("periodo_fim", periodo.inicio);
  }

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export async function carregarBiDashboard(input: {
  dashboard: BiDashboardId;
  dataInicio: string;
  dataFim: string;
  comparativo?: BiComparativoModo;
  drillLevel?: BiDrillLevel;
  unidadeId?: string | null;
  categoriaId?: string | null;
  produtoId?: string | null;
}) {
  const periodo: Periodo = { inicio: input.dataInicio, fim: input.dataFim };
  const modo = input.comparativo ?? "mes_mes";
  const comp = resolverComparativo(modo);

  const [
    atual,
    anterior,
    pedidos,
    kds,
    estoque,
    crm,
    fluxo,
    metas,
    funcionarios,
    delivery,
    salao,
  ] = await Promise.all([
    resumoVendas(periodo),
    resumoVendas(comp.anterior),
    metricasPedidos(periodo),
    metricasKdsPeriodo(periodo),
    metricasEstoquePeriodo(periodo),
    metricasCrmPeriodo(periodo),
    fluxoNoPeriodo(periodo),
    listarBiMetas(periodo),
    metricasFuncionarios(),
    metricasPedidos(periodo, "delivery"),
    metricasPedidos(periodo, "mesa"),
  ]);

  const receita = atual.analise.resumo.faturamentoRealizado;
  const cmv = atual.analise.resumo.cmvRealizado;
  const lucro = atual.analise.resumo.margemRealizada;
  const receitaAnt = anterior.analise.resumo.faturamentoRealizado;

  const horas = Math.max(
    1,
    (new Date(`${periodo.fim}T23:59:59`).getTime() -
      new Date(`${periodo.inicio}T00:00:00`).getTime()) /
      3_600_000,
  );

  const financeiros = kpisFinanceiros({
    receita,
    cmv,
    lucro,
    fluxoCaixa: fluxo,
    receitaAnterior: receitaAnt,
  });

  const operacao = kpisOperacao({
    tempoPreparoMin: kds.tempoPreparoMin,
    tempoEntregaMin: pedidos.tempoEntregaMin,
    tempoAtendimentoMin: pedidos.tempoAtendimentoMin,
    pedidosPorHora: pedidosPorHora(pedidos.total - pedidos.cancelados, horas),
  });

  const estoqueKpis = kpisEstoque({
    cmv,
    giro: estoque.giro,
    coberturaDias: estoque.cobertura,
    perdas: estoque.perdas,
  });

  const crmKpis = kpisCrm({
    ticketMedio: crm.ticket,
    frequencia: crm.frequencia,
    retencao: crm.retencao,
    ltv: crm.ltv,
    clientesAtivos: crm.ativos,
  });

  const deliveryKpis = kpisDelivery({
    cancelamentos: delivery.cancelados,
    taxaCancelamento:
      delivery.total > 0
        ? Math.round((delivery.cancelados / delivery.total) * 1000) / 10
        : null,
    tempoMedioMin: delivery.tempoEntregaMin,
    avaliacaoMedia: null,
    receita: delivery.receita,
  });

  const pedidosAnt = await metricasPedidos(comp.anterior);
  const comparativos = montarComparativo([
    {
      label: "Receita",
      atual: receita,
      anterior: receitaAnt,
      format: "currency",
    },
    {
      label: "Lucro",
      atual: lucro,
      anterior: anterior.analise.resumo.margemRealizada,
      format: "currency",
    },
    {
      label: "CMV",
      atual: cmv,
      anterior: anterior.analise.resumo.cmvRealizado,
      format: "currency",
    },
    {
      label: "Pedidos",
      atual: pedidos.total - pedidos.cancelados,
      anterior: pedidosAnt.total - pedidosAnt.cancelados,
      format: "number",
    },
  ]);

  const empresa = await getEmpresaAtual();
  const supabase = await createClient();
  const fichaIds = [...new Set(atual.vendas.map((v) => v.ficha_tecnica_id))];
  const nomes = new Map<
    string,
    { nome: string; categoriaId: string | null; categoriaNome: string | null }
  >();
  const canaisNomes = new Map<string, string>();

  if (empresa && fichaIds.length > 0) {
    const { data: fichas } = await supabase
      .from("fichas_tecnicas")
      .select("id, nome, praca_producao_id, pracas_producao(id, nome)")
      .eq("empresa_id", empresa.id)
      .in("id", fichaIds.slice(0, 200));

    for (const f of fichas ?? []) {
      const praca = f.pracas_producao as { id: string; nome: string } | null;
      nomes.set(f.id, {
        nome: f.nome,
        categoriaId: f.praca_producao_id ?? praca?.id ?? null,
        categoriaNome: praca?.nome ?? "Sem praça",
      });
    }

    const { data: canais } = await supabase
      .from("canais_venda")
      .select("id, nome")
      .eq("empresa_id", empresa.id);
    for (const c of canais ?? []) canaisNomes.set(c.id, c.nome);
  }

  const drillLevel = input.drillLevel ?? "unidade";
  const drill = agregarDrillDown(
    atual.vendas.map((v) => {
      const info = nomes.get(v.ficha_tecnica_id);
      return {
        ficha_tecnica_id: v.ficha_tecnica_id,
        produtoNome: info?.nome,
        categoriaId: info?.categoriaId,
        categoriaNome: info?.categoriaNome,
        canal_venda_id: v.canal_venda_id,
        canalNome: v.canal_venda_id
          ? (canaisNomes.get(v.canal_venda_id) ?? null)
          : null,
        valor_total: v.valor_total,
        margem_total: v.margem_total,
        quantidade: v.quantidade,
      };
    }),
    drillLevel,
    {
      unidadeId: input.unidadeId,
      categoriaId: input.categoriaId,
      produtoId: input.produtoId,
    },
  );

  const realizados: Partial<Record<BiMetaTipo, number>> = {
    faturamento: receita,
    lucro,
    cmv,
    ticket_medio:
      ticketMedio(receita, Math.max(1, pedidos.total - pedidos.cancelados)) ?? 0,
    vendas: pedidos.total - pedidos.cancelados,
    desperdicio: estoque.perdas,
  };

  const metasProgresso = montarProgressoMetas(
    metas.map((m) => ({
      id: m.id,
      tipo: m.tipo as BiMetaTipo,
      valor_meta: Number(m.valor_meta),
      periodo_inicio: m.periodo_inicio,
      periodo_fim: m.periodo_fim,
      unidade: m.unidade,
      observacao: m.observacao,
    })),
    realizados,
  );

  let kpis: BiKpi[] = financeiros;
  if (input.dashboard === "vendas") {
    kpis = [
      {
        id: "fat",
        label: "Faturamento",
        value: receita,
        format: "currency",
        deltaPct: comparativos[0]?.deltaPct,
      },
      {
        id: "qtd",
        label: "Itens vendidos",
        value: atual.analise.resumo.quantidadeTotal,
        format: "number",
      },
      {
        id: "ticket",
        label: "Ticket médio",
        value: ticketMedio(
          receita,
          Math.max(1, pedidos.total - pedidos.cancelados),
        ),
        format: "currency",
      },
      {
        id: "margem",
        label: "Margem",
        value: atual.analise.resumo.margemPercentual,
        format: "percent",
      },
    ];
  } else if (input.dashboard === "delivery") {
    kpis = deliveryKpis;
  } else if (input.dashboard === "salao") {
    kpis = [
      {
        id: "rec_salao",
        label: "Receita salão",
        value: salao.receita,
        format: "currency",
      },
      {
        id: "ped_salao",
        label: "Pedidos",
        value: salao.total - salao.cancelados,
        format: "number",
      },
      {
        id: "atend",
        label: "Tempo atendimento",
        value: salao.tempoAtendimentoMin,
        format: "minutes",
      },
      {
        id: "ticket_salao",
        label: "Ticket médio",
        value: ticketMedio(
          salao.receita,
          Math.max(1, salao.total - salao.cancelados),
        ),
        format: "currency",
      },
    ];
  } else if (input.dashboard === "estoque") {
    kpis = estoqueKpis;
  } else if (input.dashboard === "crm") {
    kpis = crmKpis;
  } else if (input.dashboard === "kds") {
    kpis = operacao;
  } else if (input.dashboard === "funcionarios") {
    kpis = [
      {
        id: "ativos",
        label: "Funcionários ativos",
        value: funcionarios.ativos,
        format: "number",
      },
      {
        id: "custo",
        label: "Custo mensal",
        value: funcionarios.custoMensal,
        format: "currency",
      },
    ];
  } else if (input.dashboard === "visao_geral") {
    kpis = [
      ...financeiros.slice(0, 3),
      ...operacao.slice(0, 2),
      crmKpis[0]!,
      estoqueKpis[3]!,
    ];
  } else if (input.dashboard === "metas") {
    kpis = financeiros.slice(0, 4);
  }

  return {
    periodo,
    comparativoLabel: comp.label,
    comparativoModo: modo,
    kpis,
    financeiros,
    operacao,
    estoque: estoqueKpis,
    crm: crmKpis,
    delivery: deliveryKpis,
    comparativos,
    drill,
    drillLevel,
    metas: metasProgresso,
    porCanal: pedidos.porCanal,
    porProduto: atual.analise.porProduto.slice(0, 15),
    funcionarios,
    salao,
  };
}

export type BiDashboardData = Awaited<ReturnType<typeof carregarBiDashboard>>;
