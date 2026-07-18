import { type NextRequest, NextResponse } from "next/server";

import { listarContasPagarParaExportacao } from "@/features/contas-pagar/queries";
import { listarContasReceberParaExportacao } from "@/features/contas-receber/queries";
import { buscarDRE } from "@/features/dre/queries";
import { buscarFluxoCaixaPorMes } from "@/features/fluxo-caixa/queries";
import { gerarExcel } from "@/features/relatorios/excel";
import { gerarRelatorioPdf } from "@/features/relatorios/pdf";
import { formatarData, formatarMoeda } from "@/lib/format";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

const CATEGORIA_ORIGEM_LABEL: Record<string, string> = {
  compra: "Compra",
  despesa_fixa: "Despesa fixa",
  manual: "Manual",
};

const STATUS_CONTA_PAGAR_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

const STATUS_CONTA_RECEBER_LABEL: Record<string, string> = {
  pendente: "Pendente",
  recebido_parcial: "Recebido parcialmente",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

interface RelatorioTabular {
  titulo: string;
  subtitulo: string;
  colunas: string[];
  linhas: (string | number)[][];
  colunasNumericas: number[];
}

async function montarContasPagar(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const status = searchParams.get("status") ?? undefined;
  const fornecedorId = searchParams.get("fornecedorId") ?? undefined;
  const contas = await listarContasPagarParaExportacao({ status, fornecedorId });

  return {
    titulo: "Contas a Pagar",
    subtitulo: status ? `Status: ${STATUS_CONTA_PAGAR_LABEL[status] ?? status}` : "Todos os status",
    colunas: ["Vencimento", "Descrição", "Fornecedor", "Origem", "Status", "Valor", "Valor pago"],
    colunasNumericas: [5, 6],
    linhas: contas.map((conta) => [
      formatarData(conta.data_vencimento),
      conta.descricao,
      conta.fornecedores?.nome ?? "—",
      CATEGORIA_ORIGEM_LABEL[conta.categoria_origem] ?? conta.categoria_origem,
      conta.atrasada ? "Atrasada" : (STATUS_CONTA_PAGAR_LABEL[conta.status] ?? conta.status),
      formatarMoeda(conta.valor),
      conta.valor_pago !== null ? formatarMoeda(conta.valor_pago) : "—",
    ]),
  };
}

async function montarContasReceber(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const status = searchParams.get("status") ?? undefined;
  const clienteId = searchParams.get("clienteId") ?? undefined;
  const contas = await listarContasReceberParaExportacao({ status, clienteId });

  return {
    titulo: "Contas a Receber",
    subtitulo: status ? `Status: ${STATUS_CONTA_RECEBER_LABEL[status] ?? status}` : "Todos os status",
    colunas: ["Emissão", "Descrição", "Cliente", "Parcelas", "Status", "Valor total"],
    colunasNumericas: [5],
    linhas: contas.map((conta) => [
      formatarData(conta.data_emissao),
      conta.descricao,
      conta.clientes?.nome ?? "—",
      `${conta.contas_receber_parcelas.filter((p) => p.status === "recebido").length}/${conta.numero_parcelas}`,
      STATUS_CONTA_RECEBER_LABEL[conta.status] ?? conta.status,
      formatarMoeda(conta.valor_total),
    ]),
  };
}

async function montarFluxoCaixa(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const dataInicio = searchParams.get("dataInicio") || primeiroDiaDoMesAtual();
  const dataFim = searchParams.get("dataFim") || ultimoDiaDoMesAtual();
  const meses = await buscarFluxoCaixaPorMes({ dataInicio, dataFim });

  return {
    titulo: "Fluxo de Caixa",
    subtitulo: `${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
    colunas: ["Mês", "Entradas realizadas", "Saídas realizadas", "Saldo realizado", "Entradas projetadas", "Saídas projetadas", "Saldo projetado"],
    colunasNumericas: [1, 2, 3, 4, 5, 6],
    linhas: meses.map((mes) => [
      mes.mes,
      formatarMoeda(mes.entradasRealizadas),
      formatarMoeda(mes.saidasRealizadas),
      formatarMoeda(mes.saldoRealizado),
      formatarMoeda(mes.entradasProjetadas),
      formatarMoeda(mes.saidasProjetadas),
      formatarMoeda(mes.saldoProjetado),
    ]),
  };
}

async function montarDre(searchParams: URLSearchParams): Promise<RelatorioTabular> {
  const dataInicio = searchParams.get("dataInicio") || primeiroDiaDoMesAtual();
  const dataFim = searchParams.get("dataFim") || ultimoDiaDoMesAtual();
  const dre = await buscarDRE({ dataInicio, dataFim });

  const linhas: (string | number)[][] = [
    ["Receita bruta", formatarMoeda(dre.receitaBruta)],
    ["(-) CMV", formatarMoeda(dre.cmv)],
    ["= Lucro bruto", formatarMoeda(dre.lucroBruto)],
    ["Margem bruta", dre.margemBrutaPercentual !== null ? `${dre.margemBrutaPercentual.toFixed(1)}%` : "—"],
    ...dre.despesasPorCategoria.map((despesa): (string | number)[] => [`(-) ${despesa.categoria}`, formatarMoeda(despesa.valor)]),
    ["(-) Despesas operacionais (total)", formatarMoeda(dre.despesasOperacionais)],
    ["= Lucro líquido", formatarMoeda(dre.lucroLiquido)],
    ["Margem líquida", dre.margemLiquidaPercentual !== null ? `${dre.margemLiquidaPercentual.toFixed(1)}%` : "—"],
  ];

  return {
    titulo: "DRE — Demonstrativo de Resultado",
    subtitulo: `${formatarData(dataInicio)} a ${formatarData(dataFim)} — regime de caixa`,
    colunas: ["Linha", "Valor"],
    colunasNumericas: [1],
    linhas,
  };
}

const MONTADORES: Record<string, (searchParams: URLSearchParams) => Promise<RelatorioTabular>> = {
  "contas-pagar": montarContasPagar,
  "contas-receber": montarContasReceber,
  "fluxo-caixa": montarFluxoCaixa,
  dre: montarDre,
};

/**
 * Exportação PDF/Excel do módulo Financeiro (Sprint 06) — Route Handler
 * (não Server Action) porque o resultado é um arquivo para download, mesmo
 * padrão de src/app/api/relatorios/[tipo]/route.ts (Sprint 04), que só
 * gerava CSV. Reaproveita gerarExcel/gerarRelatorioPdf (genéricos,
 * src/features/relatorios) — nenhuma tela monta o PDF/Excel por conta
 * própria.
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

  if (formato === "xlsx") {
    const excel = await gerarExcel(relatorio.titulo, relatorio.colunas, relatorio.linhas);
    return new NextResponse(excel as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nomeArquivo}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ erro: "Formato inválido — use 'xlsx' ou 'pdf'." }, { status: 400 });
}
