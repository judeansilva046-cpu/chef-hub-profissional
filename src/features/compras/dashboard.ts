import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export interface ComprasPorFornecedor {
  fornecedorId: string;
  fornecedorNome: string;
  total: number;
  quantidadePedidos: number;
}

export interface ComprasPorCategoria {
  categoria: string;
  total: number;
}

export interface VariacaoPrecoItem {
  ingredienteId: string;
  ingredienteNome: string;
  fornecedorNome: string;
  precoAnterior: number;
  precoAtual: number;
  variacaoPercentual: number;
}

export interface DashboardCompras {
  totalComprasPeriodo: number;
  quantidadePedidosPeriodo: number;
  ticketMedioPedido: number;
  comprasPorFornecedor: ComprasPorFornecedor[];
  comprasPorCategoria: ComprasPorCategoria[];
  economiaEmCotacoes: number;
  cotacoesFinalizadasPeriodo: number;
  maioresAumentos: VariacaoPrecoItem[];
  maioresQuedas: VariacaoPrecoItem[];
  solicitacoesPendentes: number;
  pedidosAguardandoAprovacao: number;
  pedidosAtrasados: number;
  divergenciasRecebimentoPeriodo: number;
  melhoresFornecedores: Array<{
    fornecedorId: string;
    fornecedorNome: string;
    scoreGeral: number;
    taxaEntregaCompleta: number | null;
  }>;
}

/**
 * Todos os indicadores calculados a partir das tabelas já existentes — sem
 * views/materializações novas, mesmo espírito de calculations.ts do CRM
 * (Sprint07): busca as linhas cruas e agrega em memória, já que os volumes
 * de um único período/empresa são pequenos.
 */
export async function buscarIndicadoresDashboardCompras(
  diasPeriodo = 30,
): Promise<DashboardCompras> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return {
      totalComprasPeriodo: 0,
      quantidadePedidosPeriodo: 0,
      ticketMedioPedido: 0,
      comprasPorFornecedor: [],
      comprasPorCategoria: [],
      economiaEmCotacoes: 0,
      cotacoesFinalizadasPeriodo: 0,
      maioresAumentos: [],
      maioresQuedas: [],
      solicitacoesPendentes: 0,
      pedidosAguardandoAprovacao: 0,
      pedidosAtrasados: 0,
      divergenciasRecebimentoPeriodo: 0,
      melhoresFornecedores: [],
    };
  }

  const supabase = await createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - diasPeriodo);
  const desdeIso = desde.toISOString();
  const hoje = new Date().toISOString().slice(0, 10);

  const [
    { data: pedidosPeriodo },
    { data: cotacoesFinalizadas },
    { data: precosComHistorico },
    { count: solicitacoesPendentesCount },
    { count: pedidosAguardandoAprovacaoCount },
    { count: pedidosAtrasadosCount },
    { count: divergenciasCount },
    { data: score },
  ] = await Promise.all([
    supabase
      .from("pedidos_compra")
      .select("id, total, fornecedor_id, fornecedores(nome, categorias)")
      .eq("empresa_id", empresa.id)
      .neq("status", "cancelado")
      .gte("criado_em", desdeIso),
    supabase
      .from("compras_cotacoes")
      .select(
        "id, fornecedor_vencedor_id, compras_cotacoes_fornecedores(fornecedor_id, valor_frete, valor_impostos, status, compras_cotacoes_propostas_itens(preco_unitario, cotacao_item_id))",
      )
      .eq("empresa_id", empresa.id)
      .eq("status", "finalizada")
      .gte("finalizado_em", desdeIso),
    supabase
      .from("fornecedor_ingredientes")
      .select(
        "ingrediente_id, preco_unitario, preco_anterior, atualizado_em, ingredientes(nome), fornecedores(nome)",
      )
      .eq("empresa_id", empresa.id)
      .not("preco_anterior", "is", null)
      .gte("atualizado_em", desdeIso),
    supabase
      .from("solicitacoes_compra")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .in("status", ["pendente", "ajuste_solicitado"]),
    supabase
      .from("pedidos_compra")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("status", "aguardando_aprovacao"),
    supabase
      .from("pedidos_compra")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .lt("data_prevista_entrega", hoje)
      .not("status", "in", "(recebido,cancelado)"),
    supabase
      .from("compras_recebimentos_itens")
      .select("id, compras_recebimentos!inner(criado_em)", { count: "exact", head: true })
      .eq("empresa_id", empresa.id)
      .eq("divergencia", true)
      .gte("compras_recebimentos.criado_em", desdeIso),
    supabase
      .from("compras_fornecedores_score")
      .select("fornecedor_id, nome, score_geral, taxa_entrega_completa")
      .eq("empresa_id", empresa.id)
      .order("score_geral", { ascending: false })
      .limit(5),
  ]);

  const pedidos = (pedidosPeriodo ?? []) as unknown as Array<{
    id: string;
    total: number;
    fornecedor_id: string;
    fornecedores: { nome: string; categorias: string[] } | null;
  }>;

  const totalComprasPeriodo = pedidos.reduce((soma, p) => soma + p.total, 0);
  const quantidadePedidosPeriodo = pedidos.length;
  const ticketMedioPedido = quantidadePedidosPeriodo > 0 ? totalComprasPeriodo / quantidadePedidosPeriodo : 0;

  const porFornecedor = new Map<string, ComprasPorFornecedor>();
  const porCategoria = new Map<string, number>();
  for (const pedido of pedidos) {
    const nome = pedido.fornecedores?.nome ?? "—";
    const atual = porFornecedor.get(pedido.fornecedor_id);
    if (atual) {
      atual.total += pedido.total;
      atual.quantidadePedidos += 1;
    } else {
      porFornecedor.set(pedido.fornecedor_id, {
        fornecedorId: pedido.fornecedor_id,
        fornecedorNome: nome,
        total: pedido.total,
        quantidadePedidos: 1,
      });
    }

    const categorias = pedido.fornecedores?.categorias ?? [];
    const categoria = categorias[0] ?? "Sem categoria";
    porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + pedido.total);
  }

  const comprasPorFornecedor = [...porFornecedor.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const comprasPorCategoria = [...porCategoria.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);

  const cotacoes = (cotacoesFinalizadas ?? []) as unknown as Array<{
    id: string;
    fornecedor_vencedor_id: string | null;
    compras_cotacoes_fornecedores: Array<{
      fornecedor_id: string;
      valor_frete: number;
      valor_impostos: number;
      status: string;
      compras_cotacoes_propostas_itens: Array<{ preco_unitario: number; cotacao_item_id: string }>;
    }>;
  }>;

  let economiaEmCotacoes = 0;
  for (const cotacao of cotacoes) {
    const totais = cotacao.compras_cotacoes_fornecedores
      .filter((cf) => cf.compras_cotacoes_propostas_itens.length > 0)
      .map((cf) => ({
        fornecedorId: cf.fornecedor_id,
        total:
          cf.compras_cotacoes_propostas_itens.reduce((soma, p) => soma + p.preco_unitario, 0) +
          cf.valor_frete +
          cf.valor_impostos,
      }));

    const vencedor = totais.find((t) => t.fornecedorId === cotacao.fornecedor_vencedor_id);
    const piorAlternativa = totais.filter((t) => t.fornecedorId !== cotacao.fornecedor_vencedor_id);
    if (vencedor && piorAlternativa.length > 0) {
      const maiorAlternativa = Math.max(...piorAlternativa.map((t) => t.total));
      economiaEmCotacoes += Math.max(0, maiorAlternativa - vencedor.total);
    }
  }

  const variacoes = (precosComHistorico ?? [])
    .map((row) => {
      const r = row as unknown as {
        ingrediente_id: string;
        preco_unitario: number;
        preco_anterior: number;
        ingredientes: { nome: string };
        fornecedores: { nome: string };
      };
      const variacaoPercentual =
        r.preco_anterior > 0 ? ((r.preco_unitario - r.preco_anterior) / r.preco_anterior) * 100 : 0;
      return {
        ingredienteId: r.ingrediente_id,
        ingredienteNome: r.ingredientes.nome,
        fornecedorNome: r.fornecedores.nome,
        precoAnterior: r.preco_anterior,
        precoAtual: r.preco_unitario,
        variacaoPercentual,
      };
    })
    .filter((v) => v.variacaoPercentual !== 0);

  const maioresAumentos = [...variacoes]
    .filter((v) => v.variacaoPercentual > 0)
    .sort((a, b) => b.variacaoPercentual - a.variacaoPercentual)
    .slice(0, 5);
  const maioresQuedas = [...variacoes]
    .filter((v) => v.variacaoPercentual < 0)
    .sort((a, b) => a.variacaoPercentual - b.variacaoPercentual)
    .slice(0, 5);

  return {
    totalComprasPeriodo,
    quantidadePedidosPeriodo,
    ticketMedioPedido,
    comprasPorFornecedor,
    comprasPorCategoria,
    economiaEmCotacoes,
    cotacoesFinalizadasPeriodo: cotacoes.length,
    maioresAumentos,
    maioresQuedas,
    solicitacoesPendentes: solicitacoesPendentesCount ?? 0,
    pedidosAguardandoAprovacao: pedidosAguardandoAprovacaoCount ?? 0,
    pedidosAtrasados: pedidosAtrasadosCount ?? 0,
    divergenciasRecebimentoPeriodo: divergenciasCount ?? 0,
    melhoresFornecedores: (score ?? [])
      .filter((s): s is typeof s & { fornecedor_id: string; nome: string } =>
        Boolean(s.fornecedor_id && s.nome),
      )
      .map((s) => ({
        fornecedorId: s.fornecedor_id,
        fornecedorNome: s.nome,
        scoreGeral: s.score_geral ?? 0,
        taxaEntregaCompleta: s.taxa_entrega_completa,
      })),
  };
}
