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
import { relatorioCompras, relatorioVendas } from "@/features/relatorios/queries";
import { formatarData } from "@/lib/format";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

/**
 * Exportação CSV dos Relatórios Gerenciais. Um Route Handler (não Server
 * Action) porque o resultado é um arquivo para download, não uma mutação —
 * mesmo motivo de src/app/auth/confirm/route.ts ser um endpoint técnico
 * fora dos route groups de página. `formato` já aceita 'pdf' na assinatura
 * como estrutura preparada para exportação PDF futura — hoje retorna 501,
 * nenhuma geração de PDF foi implementada nesta sprint.
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

  if (formato === "pdf") {
    return NextResponse.json(
      {
        erro:
          "Exportação em PDF ainda não implementada nesta sprint — estrutura preparada (parâmetro formato), geração real fica para uma sprint futura.",
      },
      { status: 501 },
    );
  }

  let csv: string;

  switch (tipo) {
    case "vendas": {
      const linhas = await relatorioVendas({ dataInicio, dataFim, canalVendaId });
      csv = gerarCsv(
        ["Data", "Ficha técnica", "Canal", "Cliente", "Quantidade", "Preço unitário", "Valor total", "Margem"],
        linhas.map((linha) => [
          formatarData(linha.dataVenda),
          linha.fichaTecnicaNome,
          linha.canalNome ?? "",
          linha.clienteNome ?? "",
          linha.quantidade,
          linha.precoUnitario,
          linha.valorTotal,
          linha.margemTotal,
        ]),
      );
      break;
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
      csv = gerarCsv(
        ["Produto", "Quantidade vendida", "Faturamento", "Custo (CMV)", "Margem"],
        porProduto.map((linha) => [
          nomesPorFicha.get(linha.fichaTecnicaId) ?? "—",
          linha.quantidadeVendida,
          linha.faturamento,
          linha.custoTotal,
          linha.margem,
        ]),
      );
      break;
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
      csv = gerarCsv(
        ["Canal", "Quantidade vendida", "Faturamento", "Custo (CMV)", "Margem"],
        porCanal.map((linha) => [
          linha.canalVendaId ? (nomesPorCanal.get(linha.canalVendaId) ?? "—") : "Sem canal",
          linha.quantidadeVendida,
          linha.faturamento,
          linha.custoTotal,
          linha.margem,
        ]),
      );
      break;
    }
    case "estoque": {
      const saldos = await listarSaldosEstoque();
      csv = gerarCsv(
        ["Ingrediente", "Saldo atual", "Estoque mínimo", "Custo médio ponderado", "Valor em estoque"],
        saldos.map((item) => [
          item.ingrediente.nome,
          item.quantidadeAtual,
          item.ingrediente.estoque_minimo,
          item.custoMedioPonderado,
          item.valorEmEstoque,
        ]),
      );
      break;
    }
    case "compras": {
      const linhas = await relatorioCompras({ dataInicio, dataFim });
      csv = gerarCsv(
        ["Data do pedido", "Fornecedor", "Status", "Valor total"],
        linhas.map((linha) => [
          formatarData(linha.dataPedido),
          linha.fornecedorNome,
          linha.status,
          linha.valorTotal,
        ]),
      );
      break;
    }
    case "producao": {
      const producoes = await listarProducoesPlanejadas({ dataInicio, dataFim });
      csv = gerarCsv(
        ["Data", "Ficha técnica", "Quantidade planejada", "Status"],
        producoes.map((producao) => [
          formatarData(producao.data_producao),
          producao.fichas_tecnicas.nome,
          producao.quantidade_planejada,
          producao.status,
        ]),
      );
      break;
    }
    default:
      return NextResponse.json({ erro: "Tipo de relatório desconhecido." }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${tipo}-${dataInicio}-a-${dataFim}.csv"`,
    },
  });
}
