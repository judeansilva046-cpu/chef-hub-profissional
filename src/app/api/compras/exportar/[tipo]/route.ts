import { type NextRequest, NextResponse } from "next/server";

import {
  listarAvaliacoesParaExportacao,
  listarComprasPorCentroCustoParaExportacao,
  listarCotacoesParaExportacao,
  listarDivergenciasParaExportacao,
  listarHistoricoPrecosParaExportacao,
  listarPedidosParaExportacao,
  listarSolicitacoesParaExportacao,
} from "@/features/compras/relatorios";
import { gerarExcel } from "@/features/relatorios/excel";
import { gerarRelatorioPdf } from "@/features/relatorios/pdf";
import { formatarData, formatarDataHora, formatarDecimal, formatarMoeda } from "@/lib/format";

interface RelatorioTabular {
  titulo: string;
  subtitulo: string;
  colunas: string[];
  linhas: (string | number)[][];
  colunasNumericas: number[];
}

async function montarSolicitacoes(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const status = searchParams.get("status") ?? undefined;
  const linhas = await listarSolicitacoesParaExportacao(status);
  return {
    titulo: "Solicitações de Compra",
    subtitulo: status ? `Status: ${status}` : "Todos os status",
    colunas: ["Número", "Criada em", "Setor", "Prioridade", "Status", "Valor estimado"],
    colunasNumericas: [5],
    linhas: linhas.map((s) => [
      s.numero ?? "—",
      formatarDataHora(s.criadoEm),
      s.setor ?? "—",
      s.prioridade,
      s.status,
      formatarMoeda(s.valorEstimado),
    ]),
  };
}

async function montarCotacoes(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const status = searchParams.get("status") ?? undefined;
  const linhas = await listarCotacoesParaExportacao(status);
  return {
    titulo: "Cotações",
    subtitulo: status ? `Status: ${status}` : "Todos os status",
    colunas: ["Número", "Criada em", "Status", "Fornecedores convidados", "Vencedor", "Escolha automática"],
    colunasNumericas: [3],
    linhas: linhas.map((c) => [
      c.numero ?? "—",
      formatarDataHora(c.criadoEm),
      c.status,
      c.quantidadeFornecedores,
      c.fornecedorVencedor ?? "—",
      c.escolhaAutomatica ? "Sim" : "Não",
    ]),
  };
}

async function montarPedidos(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const status = searchParams.get("status") ?? undefined;
  const linhas = await listarPedidosParaExportacao(status);
  return {
    titulo: "Pedidos de Compra",
    subtitulo: status ? `Status: ${status}` : "Todos os status",
    colunas: ["Número", "Criado em", "Fornecedor", "Centro de custo", "Status", "Total"],
    colunasNumericas: [5],
    linhas: linhas.map((p) => [
      p.numero ?? "—",
      formatarDataHora(p.criadoEm),
      p.fornecedor,
      p.centroCusto ?? "—",
      p.status,
      formatarMoeda(p.total),
    ]),
  };
}

async function montarDivergencias(): Promise<RelatorioTabular> {
  const linhas = await listarDivergenciasParaExportacao();
  return {
    titulo: "Divergências de Recebimento",
    subtitulo: `${linhas.length} divergência(s)`,
    colunas: ["Data", "Pedido", "Fornecedor", "Ingrediente", "Qtd. recusada", "Motivo"],
    colunasNumericas: [4],
    linhas: linhas.map((d) => [
      formatarDataHora(d.criadoEm),
      d.pedidoNumero ? `#${d.pedidoNumero}` : "—",
      d.fornecedor,
      d.ingrediente,
      formatarDecimal(d.quantidadeRecusada),
      d.motivo ?? "—",
    ]),
  };
}

async function montarHistoricoPrecos(): Promise<RelatorioTabular> {
  const linhas = await listarHistoricoPrecosParaExportacao();
  return {
    titulo: "Histórico de Preços",
    subtitulo: `${linhas.length} registro(s) mais recentes`,
    colunas: ["Data", "Ingrediente", "Fornecedor", "Preço unitário"],
    colunasNumericas: [3],
    linhas: linhas.map((h) => [
      formatarDataHora(h.dataReferencia),
      h.ingrediente,
      h.fornecedor,
      formatarMoeda(h.precoUnitario),
    ]),
  };
}

async function montarAvaliacoes(): Promise<RelatorioTabular> {
  const linhas = await listarAvaliacoesParaExportacao();
  return {
    titulo: "Avaliações de Fornecedores",
    subtitulo: `${linhas.length} avaliação(ões)`,
    colunas: ["Data", "Fornecedor", "Pontualidade", "Qualidade", "Preço", "Atendimento", "Comentário"],
    colunasNumericas: [2, 3, 4, 5],
    linhas: linhas.map((a) => [
      formatarData(a.criadoEm),
      a.fornecedor,
      a.pontualidade,
      a.qualidade,
      a.preco,
      a.atendimento,
      a.comentario ?? "—",
    ]),
  };
}

async function montarComprasPorCentroCusto(): Promise<RelatorioTabular> {
  const linhas = await listarComprasPorCentroCustoParaExportacao();
  return {
    titulo: "Compras por Centro de Custo",
    subtitulo: `${linhas.length} centro(s) de custo`,
    colunas: ["Centro de custo", "Pedidos", "Total"],
    colunasNumericas: [1, 2],
    linhas: linhas.map((c) => [c.centroCusto, c.quantidadePedidos, formatarMoeda(c.total)]),
  };
}

const MONTADORES: Record<string, (searchParams: URLSearchParams) => Promise<RelatorioTabular>> = {
  solicitacoes: montarSolicitacoes,
  cotacoes: montarCotacoes,
  pedidos: montarPedidos,
  divergencias: montarDivergencias,
  "historico-precos": montarHistoricoPrecos,
  avaliacoes: montarAvaliacoes,
  "compras-por-centro-custo": montarComprasPorCentroCusto,
};

/**
 * Exportação PDF/Excel do módulo Compras (Sprint 08) — Route Handler, mesmo
 * padrão de src/app/api/financeiro/exportar/[tipo]/route.ts (Sprint 06) e
 * src/app/api/crm/exportar/clientes/route.ts (Sprint 07): reaproveita
 * gerarExcel/gerarRelatorioPdf genéricos, nenhuma tela monta o arquivo por
 * conta própria.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const montar = MONTADORES[tipo];
  if (!montar) {
    return NextResponse.json({ erro: "Tipo de relatório desconhecido." }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const formato = searchParams.get("formato") ?? "xlsx";

  const relatorio = await montar(searchParams);
  const nomeArquivo = `${tipo}-${new Date().toISOString().slice(0, 10)}`;

  if (formato === "pdf") {
    const pdf = await gerarRelatorioPdf({
      titulo: relatorio.titulo,
      subtitulo: relatorio.subtitulo,
      colunas: relatorio.colunas,
      linhas: relatorio.linhas,
      colunasAlinhadasDireita: relatorio.colunasNumericas,
    });
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}.pdf"`,
      },
    });
  }

  const excel = await gerarExcel(relatorio.titulo, relatorio.colunas, relatorio.linhas);
  return new NextResponse(excel as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}.xlsx"`,
    },
  });
}
