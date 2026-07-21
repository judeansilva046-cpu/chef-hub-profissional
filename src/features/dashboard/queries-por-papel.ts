import "server-only";

import { cache } from "react";

import { analisarVendas, somarMetasNoPeriodo } from "@/features/dashboard/calculations";
import {
  analisarFichasEmAlerta,
  calcularMargemNecessariaPercentual,
  calcularPontoEquilibrioReceita,
} from "@/features/financeiro/calculations";
import {
  calcularCustosFixosTotais,
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
  listarFichasTecnicasParaFinanceiro,
  listarMetasVendas,
} from "@/features/financeiro/queries";
import { listarPedidosCompra } from "@/features/compras/queries";
import { buscarResumoEstoque } from "@/features/estoque/queries";
import { listarMembrosEmpresa } from "@/features/equipe/queries";
import { listarExpedicoesAbertas } from "@/features/expedicao/queries";
import { listarPedidosParaKds } from "@/features/kds/queries";
import { listarMesas } from "@/features/mesas/queries";
import { getSemanaRange, hojeIso } from "@/features/producao/date-range";
import { listarProducoesPlanejadas } from "@/features/producao/queries";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { createClient } from "@/lib/supabase/server";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import type { PapelEmpresa } from "@/server/auth/permissoes-rota";

import {
  blocosDoPapel,
  type DashboardBloco,
  papelPodeVerBloco,
} from "./permissions";

function hojeIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ContagemPedidosPorStatus {
  rascunho: number;
  confirmado: number;
  em_preparo: number;
  pronto: number;
  saiu_para_entrega: number;
  entregue: number;
  cancelado: number;
  aguardandoPagamento: number;
  emAndamento: number;
}

export interface ResumoCaixaTurno {
  caixaAberto: boolean;
  saldoInicial: number;
  totalVendas: number;
  totalSangrias: number;
  totalSuprimentos: number;
  porForma: { pix: number; cartao: number; dinheiro: number; outros: number };
}

export interface ResumoMesasDash {
  abertas: number;
  livres: number;
  ocupadas: number;
  total: number;
}

export interface ItemAuditoria {
  id: string;
  statusNovo: string;
  statusAnterior: string | null;
  criadoEm: string;
  pedidoId: string;
}

export interface DashboardData {
  papel: PapelEmpresa;
  blocos: readonly DashboardBloco[];
  periodo: { dataInicio: string; dataFim: string; hoje: string };
  financeiro?: {
    faturamentoDia: number;
    faturamentoMes: number;
    cmvPercentual: number | null;
    margemPercentual: number | null;
    lucroEstimado: number;
    ticketMedio: number | null;
    pontoEquilibrioReceita: number | null;
    faturamentoProjetado: number | null;
    contasPagarEstimado: number;
    contasReceberEstimado: number;
    fluxoCaixaDia: number;
  };
  vendas?: {
    topProdutos: Array<{ nome: string; quantidade: number; faturamento: number }>;
    porCanal: Array<{ nome: string; faturamento: number }>;
  };
  pedidos?: ContagemPedidosPorStatus;
  estoque?: {
    abaixoDoMinimo: number;
    lotesVencendoEm7Dias: number;
  };
  mesas?: ResumoMesasDash;
  caixa?: ResumoCaixaTurno;
  cozinha?: {
    emPreparo: number;
    prontos: number;
    tempoMedioMinutos: number | null;
    producoesAbertas: number;
  };
  expedicao?: { abertas: number };
  equipe?: { membrosAtivos: number };
  auditoria?: ItemAuditoria[];
  alertas?: {
    fichasNoVermelho: number;
    fichasAbaixoDoNecessario: number;
    pedidosCompraPendentes: number;
  };
  clientesAtivos?: number;
}

async function contarPedidosPorStatus(
  empresaId: string,
): Promise<ContagemPedidosPorStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, status, total")
    .eq("empresa_id", empresaId)
    .neq("status", "entregue");

  if (error) throw error;

  const base: ContagemPedidosPorStatus = {
    rascunho: 0,
    confirmado: 0,
    em_preparo: 0,
    pronto: 0,
    saiu_para_entrega: 0,
    entregue: 0,
    cancelado: 0,
    aguardandoPagamento: 0,
    emAndamento: 0,
  };

  const ids = (data ?? []).map((p) => p.id);
  let pagosPorPedido = new Map<string, number>();

  if (ids.length > 0) {
    const { data: pags, error: errPag } = await supabase
      .from("pagamentos")
      .select("pedido_id, valor")
      .in("pedido_id", ids);
    if (errPag) throw errPag;
    pagosPorPedido = new Map();
    for (const p of pags ?? []) {
      pagosPorPedido.set(
        p.pedido_id,
        (pagosPorPedido.get(p.pedido_id) ?? 0) + Number(p.valor),
      );
    }
  }

  for (const pedido of data ?? []) {
    const status = pedido.status as keyof ContagemPedidosPorStatus;
    if (status in base && status !== "aguardandoPagamento" && status !== "emAndamento") {
      base[status] += 1;
    }
    if (
      ["confirmado", "em_preparo", "pronto", "saiu_para_entrega", "rascunho"].includes(
        pedido.status,
      )
    ) {
      base.emAndamento += 1;
    }
    const pago = pagosPorPedido.get(pedido.id) ?? 0;
    if (
      pedido.status !== "cancelado" &&
      pedido.status !== "entregue" &&
      pago + 0.009 < Number(pedido.total)
    ) {
      base.aguardandoPagamento += 1;
    }
  }

  // entregue/cancelado do mês (contagem separada)
  const mesInicio = primeiroDiaDoMesAtual();
  const { count: entregues } = await supabase
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .eq("status", "entregue")
    .gte("entregue_em", `${mesInicio}T00:00:00`);
  const { count: cancelados } = await supabase
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId)
    .eq("status", "cancelado")
    .gte("cancelado_em", `${mesInicio}T00:00:00`);

  base.entregue = entregues ?? 0;
  base.cancelado = cancelados ?? 0;

  return base;
}

async function carregarCaixaTurno(empresaId: string): Promise<ResumoCaixaTurno> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const vazio: ResumoCaixaTurno = {
    caixaAberto: false,
    saldoInicial: 0,
    totalVendas: 0,
    totalSangrias: 0,
    totalSuprimentos: 0,
    porForma: { pix: 0, cartao: 0, dinheiro: 0, outros: 0 },
  };

  if (!user) return vazio;

  const { data: caixa } = await supabase
    .from("caixas")
    .select("id, saldo_inicial, status")
    .eq("empresa_id", empresaId)
    .eq("operador_id", user.id)
    .eq("status", "aberto")
    .maybeSingle();

  if (!caixa) return vazio;

  const { data: movs } = await supabase
    .from("caixa_movimentacoes")
    .select("tipo, valor, forma_pagamento")
    .eq("caixa_id", caixa.id);

  const resumo = { ...vazio, caixaAberto: true, saldoInicial: Number(caixa.saldo_inicial) };
  for (const m of movs ?? []) {
    const valor = Number(m.valor);
    if (m.tipo === "venda") resumo.totalVendas += valor;
    if (m.tipo === "sangria") resumo.totalSangrias += valor;
    if (m.tipo === "suprimento" || m.tipo === "entrada") {
      resumo.totalSuprimentos += valor;
    }
    if (m.tipo === "venda") {
      const forma = (m.forma_pagamento ?? "").toLowerCase();
      if (forma.includes("pix")) resumo.porForma.pix += valor;
      else if (forma.includes("cartao") || forma.includes("cartão") || forma.includes("credito") || forma.includes("debito")) {
        resumo.porForma.cartao += valor;
      } else if (forma.includes("dinheiro") || forma === "cash") {
        resumo.porForma.dinheiro += valor;
      } else {
        resumo.porForma.outros += valor;
      }
    }
  }
  return resumo;
}

async function carregarAuditoria(empresaId: string): Promise<ItemAuditoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedido_status_historico")
    .select("id, status_novo, status_anterior, criado_em, pedido_id")
    .eq("empresa_id", empresaId)
    .order("criado_em", { ascending: false })
    .limit(8);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    statusNovo: row.status_novo,
    statusAnterior: row.status_anterior,
    criadoEm: row.criado_em,
    pedidoId: row.pedido_id,
  }));
}

async function contasReceberEstimado(empresaId: string): Promise<number> {
  const supabase = await createClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, total")
    .eq("empresa_id", empresaId)
    .filter("status", "not.in", "(cancelado,entregue)");

  if (!pedidos?.length) return 0;

  const { data: pags } = await supabase
    .from("pagamentos")
    .select("pedido_id, valor")
    .in(
      "pedido_id",
      pedidos.map((p) => p.id),
    );

  const pago = new Map<string, number>();
  for (const p of pags ?? []) {
    pago.set(p.pedido_id, (pago.get(p.pedido_id) ?? 0) + Number(p.valor));
  }

  return pedidos.reduce((acc, p) => {
    const restante = Number(p.total) - (pago.get(p.id) ?? 0);
    return acc + Math.max(0, restante);
  }, 0);
}

/**
 * Carrega SOMENTE os blocos autorizados para o papel — consultas em paralelo.
 */
export const carregarDashboardPorPapel = cache(
  async function carregarDashboardPorPapel(
    papel: PapelEmpresa,
    opts?: { dataInicio?: string; dataFim?: string },
  ): Promise<DashboardData> {
    const empresa = await requireEmpresaAtual();
    const blocos = blocosDoPapel(papel);
    const dataInicio = opts?.dataInicio || primeiroDiaDoMesAtual();
    const dataFim = opts?.dataFim || ultimoDiaDoMesAtual();
    const hoje = hojeIsoLocal();
    const semana = getSemanaRange(hojeIso());

    const precisa = (b: DashboardBloco) => papelPodeVerBloco(papel, b);

    const [
      vendasMes,
      vendasDia,
      canais,
      custosVariaveis,
      custosFixosTotais,
      metas,
      fichas,
      resumoEstoque,
      pedidosStatus,
      mesas,
      caixa,
      kds,
      expedicoes,
      membros,
      auditoria,
      pedidosCompraR,
      pedidosCompraE,
      pedidosCompraP,
      producoes,
      receber,
    ] = await Promise.all([
      precisa("financeiro_executivo") || precisa("vendas_resumo")
        ? buscarVendasPorPeriodo({ dataInicio, dataFim })
        : Promise.resolve([]),
      precisa("financeiro_executivo")
        ? buscarVendasPorPeriodo({ dataInicio: hoje, dataFim: hoje })
        : Promise.resolve([]),
      precisa("financeiro_executivo") || precisa("vendas_resumo")
        ? listarCanaisVenda()
        : Promise.resolve([]),
      precisa("financeiro_executivo") || precisa("alertas_fichas")
        ? calcularCustosVariaveisAgregados()
        : Promise.resolve({ percentualTotal: 0, fixoTotal: 0 }),
      precisa("financeiro_executivo") || precisa("alertas_fichas")
        ? calcularCustosFixosTotais()
        : Promise.resolve(0),
      precisa("financeiro_executivo")
        ? listarMetasVendas()
        : Promise.resolve([]),
      precisa("financeiro_executivo") ||
      precisa("vendas_resumo") ||
      precisa("alertas_fichas")
        ? listarFichasTecnicasParaFinanceiro()
        : Promise.resolve([]),
      precisa("estoque_critico")
        ? buscarResumoEstoque()
        : Promise.resolve({
            ingredientesAbaixoDoMinimo: 0,
            lotesVencendoEm7Dias: 0,
          }),
      precisa("pedidos_operacao")
        ? contarPedidosPorStatus(empresa.id)
        : Promise.resolve(null),
      precisa("mesas") ? listarMesas() : Promise.resolve([]),
      precisa("caixa_turno")
        ? carregarCaixaTurno(empresa.id)
        : Promise.resolve(null),
      precisa("cozinha_fila")
        ? listarPedidosParaKds()
        : Promise.resolve([]),
      precisa("expedicao")
        ? listarExpedicoesAbertas()
        : Promise.resolve([]),
      precisa("equipe_ativa")
        ? listarMembrosEmpresa()
        : Promise.resolve([]),
      precisa("auditoria_recente")
        ? carregarAuditoria(empresa.id)
        : Promise.resolve([]),
      precisa("compras_pendentes") || precisa("financeiro_executivo")
        ? listarPedidosCompra({ status: "rascunho" })
        : Promise.resolve({ data: [], totalCount: 0 }),
      precisa("compras_pendentes") || precisa("financeiro_executivo")
        ? listarPedidosCompra({ status: "enviado" })
        : Promise.resolve({ data: [], totalCount: 0 }),
      precisa("compras_pendentes") || precisa("financeiro_executivo")
        ? listarPedidosCompra({ status: "parcialmente_recebido" })
        : Promise.resolve({ data: [], totalCount: 0 }),
      precisa("cozinha_fila")
        ? listarProducoesPlanejadas({
            dataInicio: semana.inicio,
            dataFim: semana.fim,
          })
        : Promise.resolve([]),
      precisa("financeiro_executivo")
        ? contasReceberEstimado(empresa.id)
        : Promise.resolve(0),
    ]);

    const result: DashboardData = {
      papel,
      blocos,
      periodo: { dataInicio, dataFim, hoje },
    };

    if (precisa("pedidos_operacao") && pedidosStatus) {
      result.pedidos = pedidosStatus;
    }

    if (precisa("estoque_critico")) {
      result.estoque = {
        abaixoDoMinimo: resumoEstoque.ingredientesAbaixoDoMinimo,
        lotesVencendoEm7Dias: resumoEstoque.lotesVencendoEm7Dias,
      };
    }

    if (precisa("mesas")) {
      const livres = mesas.filter((m) => m.status === "livre").length;
      const ocupadas = mesas.filter((m) => m.status === "ocupada").length;
      result.mesas = {
        total: mesas.length,
        livres,
        ocupadas,
        abertas: ocupadas,
      };
    }

    if (precisa("caixa_turno") && caixa) {
      result.caixa = caixa;
    }

    if (precisa("cozinha_fila")) {
      const emPreparo = kds.filter((p) => p.status === "em_preparo").length;
      const prontos = kds.filter((p) => p.status === "pronto").length;
      const comTempo = kds
        .map((p) => {
          const inicio = p.confirmado_em ?? p.criado_em;
          if (!inicio) return null;
          return (Date.now() - new Date(inicio).getTime()) / 60000;
        })
        .filter((n): n is number => n !== null);
      const tempoMedio =
        comTempo.length > 0
          ? comTempo.reduce((a, b) => a + b, 0) / comTempo.length
          : null;
      result.cozinha = {
        emPreparo,
        prontos,
        tempoMedioMinutos: tempoMedio,
        producoesAbertas: producoes.filter(
          (p) => p.status === "planejada" || p.status === "em_producao",
        ).length,
      };
    }

    if (precisa("expedicao")) {
      result.expedicao = { abertas: expedicoes.length };
    }

    if (precisa("equipe_ativa")) {
      result.equipe = {
        membrosAtivos: membros.filter((m) => m.ativo).length,
      };
    }

    if (precisa("auditoria_recente")) {
      result.auditoria = auditoria;
    }

    const canaisPorId = new Map(canais.map((c) => [c.id, c]));
    const nomesPorFicha = new Map(fichas.map((f) => [f.id, f.nome]));

    if (precisa("financeiro_executivo") || precisa("vendas_resumo")) {
      const analiseMes = analisarVendas(vendasMes, custosVariaveis, canaisPorId);
      const analiseDia = analisarVendas(vendasDia, custosVariaveis, canaisPorId);
      const faturamentoProjetado = somarMetasNoPeriodo(metas, dataInicio, dataFim);
      const margemNecessaria = calcularMargemNecessariaPercentual(
        custosFixosTotais,
        faturamentoProjetado,
      );
      const pontoEquilibrio = calcularPontoEquilibrioReceita(
        custosFixosTotais,
        analiseMes.resumo.margemPercentual,
      );
      const lucroEstimado =
        analiseMes.resumo.margemRealizada - custosFixosTotais;
      const ticketMedio =
        analiseMes.resumo.quantidadeTotal > 0
          ? analiseMes.resumo.faturamentoRealizado /
            analiseMes.resumo.quantidadeTotal
          : null;

      const comprasPendentesQtd =
        pedidosCompraR.totalCount +
        pedidosCompraE.totalCount +
        pedidosCompraP.totalCount;

      if (precisa("financeiro_executivo")) {
        result.financeiro = {
          faturamentoDia: analiseDia.resumo.faturamentoRealizado,
          faturamentoMes: analiseMes.resumo.faturamentoRealizado,
          cmvPercentual: analiseMes.resumo.cmvPercentual,
          margemPercentual: analiseMes.resumo.margemPercentual,
          lucroEstimado,
          ticketMedio,
          pontoEquilibrioReceita: pontoEquilibrio,
          faturamentoProjetado,
          // Proxy operacional: qtd de pedidos de compra em aberto (sem ledger AP)
          contasPagarEstimado: comprasPendentesQtd,
          contasReceberEstimado: receber,
          fluxoCaixaDia:
            (result.caixa?.totalVendas ?? 0) +
            (result.caixa?.totalSuprimentos ?? 0) -
            (result.caixa?.totalSangrias ?? 0),
        };
      }

      if (precisa("vendas_resumo")) {
        result.vendas = {
          topProdutos: analiseMes.porProduto.slice(0, 5).map((p) => ({
            nome: nomesPorFicha.get(p.fichaTecnicaId) ?? "Produto",
            quantidade: p.quantidadeVendida,
            faturamento: p.faturamento,
          })),
          porCanal: analiseMes.porCanal.map((c) => ({
            nome:
              c.canalVendaId != null
                ? (canaisPorId.get(c.canalVendaId)?.nome ?? "Canal")
                : "Sem canal",
            faturamento: c.faturamento,
          })),
        };
      }

      if (precisa("alertas_fichas")) {
        const { fichasNoVermelho, fichasAbaixoDoNecessario } =
          analisarFichasEmAlerta(fichas, custosVariaveis, margemNecessaria);
        result.alertas = {
          fichasNoVermelho: fichasNoVermelho.length,
          fichasAbaixoDoNecessario: fichasAbaixoDoNecessario.length,
          pedidosCompraPendentes:
            pedidosCompraR.totalCount +
            pedidosCompraE.totalCount +
            pedidosCompraP.totalCount,
        };
      }
    }

    if (precisa("compras_pendentes") && !result.alertas) {
      result.alertas = {
        fichasNoVermelho: 0,
        fichasAbaixoDoNecessario: 0,
        pedidosCompraPendentes:
          pedidosCompraR.totalCount +
          pedidosCompraE.totalCount +
          pedidosCompraP.totalCount,
      };
    }

    if (precisa("financeiro_executivo") || papel === "owner") {
      const supabase = await createClient();
      const { count } = await supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("empresa_id", empresa.id)
        .eq("ativo", true);
      result.clientesAtivos = count ?? 0;
    }

    return result;
  },
);
