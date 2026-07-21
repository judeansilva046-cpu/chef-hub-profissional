import { type NextRequest, NextResponse } from "next/server";

import { analisarVendas } from "@/features/dashboard/calculations";
import {
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
  listarFichasTecnicasParaFinanceiro,
} from "@/features/financeiro/queries";
import { listarProducoesPlanejadas } from "@/features/producao/queries";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { listarSaldosEstoque } from "@/features/estoque/queries";
import { gerarCsv } from "@/features/relatorios/csv";
import { gerarPdfRelatorio } from "@/features/relatorios/pdf";
import { RELATORIO_TIPOS, type RelatorioTipo } from "@/features/relatorios/tipos";
import { relatorioCompras, relatorioVendas } from "@/features/relatorios/queries";
import { formatarData } from "@/lib/format";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

interface RelatorioDados {
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
}

async function montarDadosRelatorio(
  tipo: string,
  dataInicio: string,
  dataFim: string,
  canalVendaId?: string,
): Promise<RelatorioDados | null> {
  const label =
    RELATORIO_TIPOS.find((item) => item.value === tipo)?.label ?? tipo;

  switch (tipo) {
    case "vendas": {
      const linhas = await relatorioVendas({ dataInicio, dataFim, canalVendaId });
      return {
        titulo: `Relatório de ${label}`,
        colunas: [
          "Data",
          "Ficha técnica",
          "Canal",
          "Cliente",
          "Quantidade",
          "Preço unitário",
          "Valor total",
          "Margem",
        ],
        linhas: linhas.map((linha) => [
          formatarData(linha.dataVenda),
          linha.fichaTecnicaNome,
          linha.canalNome ?? "",
          linha.clienteNome ?? "",
          linha.quantidade,
          linha.precoUnitario,
          linha.valorTotal,
          linha.margemTotal,
        ]),
      };
    }
    case "cmv":
    case "margem":
    case "produto": {
      const [vendas, fichas, canais, custosVariaveis] = await Promise.all([
        buscarVendasPorPeriodo({ dataInicio, dataFim, canalVendaId }),
        listarFichasTecnicasParaFinanceiro(),
        listarCanaisVenda(),
        calcularCustosVariaveisAgregados(),
      ]);
      const nomesPorFicha = new Map(fichas.map((ficha) => [ficha.id, ficha.nome]));
      const canaisPorId = new Map(canais.map((canal) => [canal.id, canal]));
      const { porProduto } = analisarVendas(vendas, custosVariaveis, canaisPorId);
      return {
        titulo: `Relatório de ${label}`,
        colunas: ["Produto", "Quantidade vendida", "Faturamento", "Custo (CMV)", "Margem"],
        linhas: porProduto.map((linha) => [
          nomesPorFicha.get(linha.fichaTecnicaId) ?? "—",
          linha.quantidadeVendida,
          linha.faturamento,
          linha.custoTotal,
          linha.margem,
        ]),
      };
    }
    case "canal": {
      const [vendas, canais, custosVariaveis] = await Promise.all([
        buscarVendasPorPeriodo({ dataInicio, dataFim, canalVendaId }),
        listarCanaisVenda(),
        calcularCustosVariaveisAgregados(),
      ]);
      const nomesPorCanal = new Map(canais.map((canal) => [canal.id, canal.nome]));
      const canaisPorId = new Map(canais.map((canal) => [canal.id, canal]));
      const { porCanal } = analisarVendas(vendas, custosVariaveis, canaisPorId);
      return {
        titulo: `Relatório de ${label}`,
        colunas: ["Canal", "Quantidade vendida", "Faturamento", "Custo (CMV)", "Margem"],
        linhas: porCanal.map((linha) => [
          linha.canalVendaId ? (nomesPorCanal.get(linha.canalVendaId) ?? "—") : "Sem canal",
          linha.quantidadeVendida,
          linha.faturamento,
          linha.custoTotal,
          linha.margem,
        ]),
      };
    }
    case "estoque": {
      const saldos = await listarSaldosEstoque();
      return {
        titulo: `Relatório de ${label}`,
        colunas: [
          "Ingrediente",
          "Saldo atual",
          "Estoque mínimo",
          "Custo médio ponderado",
          "Valor em estoque",
        ],
        linhas: saldos.map((item) => [
          item.ingrediente.nome,
          item.quantidadeAtual,
          item.ingrediente.estoque_minimo,
          item.custoMedioPonderado,
          item.valorEmEstoque,
        ]),
      };
    }
    case "compras": {
      const linhas = await relatorioCompras({ dataInicio, dataFim });
      return {
        titulo: `Relatório de ${label}`,
        colunas: ["Data do pedido", "Fornecedor", "Status", "Valor total"],
        linhas: linhas.map((linha) => [
          formatarData(linha.dataPedido),
          linha.fornecedorNome,
          linha.status,
          linha.valorTotal,
        ]),
      };
    }
    case "producao": {
      const producoes = await listarProducoesPlanejadas({ dataInicio, dataFim });
      return {
        titulo: `Relatório de ${label}`,
        colunas: ["Data", "Ficha técnica", "Quantidade planejada", "Status"],
        linhas: producoes.map((producao) => [
          formatarData(producao.data_producao),
          producao.fichas_tecnicas.nome,
          producao.quantidade_planejada,
          producao.status,
        ]),
      };
    }
    default:
      return null;
  }
}

/**
 * Exportação CSV/PDF dos Relatórios Gerenciais. Route Handler (não Server
 * Action) porque o resultado é um arquivo para download.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const { tipo } = await params;
  const searchParams = request.nextUrl.searchParams;
  const dataInicio = searchParams.get("dataInicio") || primeiroDiaDoMesAtual();
  const dataFim = searchParams.get("dataFim") || ultimoDiaDoMesAtual();
  const canalVendaId = searchParams.get("canalVendaId") ?? undefined;
  const formato = searchParams.get("formato") ?? "csv";

  if (formato !== "csv" && formato !== "pdf") {
    return NextResponse.json({ erro: "Formato inválido. Use csv ou pdf." }, { status: 400 });
  }

  const dados = await montarDadosRelatorio(tipo, dataInicio, dataFim, canalVendaId);
  if (!dados) {
    return NextResponse.json({ erro: "Tipo de relatório desconhecido." }, { status: 400 });
  }

  const periodoLabel = `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
  const tipoSeguro = tipo as RelatorioTipo;

  if (formato === "pdf") {
    const pdf = await gerarPdfRelatorio({
      titulo: dados.titulo,
      colunas: dados.colunas,
      linhas: dados.linhas,
      periodoLabel,
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${tipoSeguro}-${dataInicio}-a-${dataFim}.pdf"`,
      },
    });
  }

  const csv = gerarCsv(dados.colunas, dados.linhas);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${tipoSeguro}-${dataInicio}-a-${dataFim}.csv"`,
    },
  });
}
