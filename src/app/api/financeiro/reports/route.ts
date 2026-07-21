import { type NextRequest, NextResponse } from "next/server";

import { gerarPdfRelatorio } from "@/features/relatorios/pdf";
import { gerarCsv } from "@/features/relatorios/csv";
import { gerarExcelXml } from "@/features/financeiro/erp/excel";
import { carregarDashboardErp } from "@/features/financeiro/erp/queries";
import {
  listarContasPagar,
  listarContasReceber,
  listarFluxoCaixa,
} from "@/features/financeiro/erp/queries";
import { PAPEIS_FINANCEIRO } from "@/server/auth/papeis-acoes";
import { requirePapel } from "@/server/auth/require-papel";
import { comMedicao } from "@/server/observabilidade/logs";
import { primeiroDiaDoMesAtual, ultimoDiaDoMesAtual } from "@/lib/periodo";

type Formato = "csv" | "pdf" | "excel";

export async function GET(request: NextRequest) {
  try {
    await requirePapel(...PAPEIS_FINANCEIRO);
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") ?? "dre";
    const formato = (searchParams.get("formato") ?? "csv") as Formato;
    const dataInicio = searchParams.get("dataInicio") || primeiroDiaDoMesAtual();
    const dataFim = searchParams.get("dataFim") || ultimoDiaDoMesAtual();

    const { titulo, colunas, linhas } = await comMedicao(
      `GET /api/financeiro/reports:${tipo}`,
      "rota",
      () => montar(tipo, dataInicio, dataFim),
    );

    if (formato === "csv") {
      const body = gerarCsv(colunas, linhas);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${tipo}.csv"`,
        },
      });
    }

    if (formato === "excel") {
      const body = gerarExcelXml(titulo, colunas, linhas);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="${tipo}.xls"`,
        },
      });
    }

    const pdf = await gerarPdfRelatorio({
      titulo,
      colunas,
      linhas,
      periodoLabel: `${dataInicio} a ${dataFim}`,
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${tipo}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar relatório.";
    const status = message.includes("permissão") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function montar(
  tipo: string,
  dataInicio: string,
  dataFim: string,
): Promise<{
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
}> {
  const dash = await carregarDashboardErp({ dataInicio, dataFim });

  switch (tipo) {
    case "dre": {
      const d = dash.dre;
      return {
        titulo: "DRE",
        colunas: ["Linha", "Valor"],
        linhas: [
          ["Receita bruta", d.receitaBruta],
          ["Impostos", d.impostos],
          ["Receita líquida", d.receitaLiquida],
          ["CMV", d.cmv],
          ["Lucro bruto", d.lucroBruto],
          ["Despesas operacionais", d.despesasOperacionais],
          ["Folha", d.folha],
          ["Marketing", d.marketing],
          ["Aluguel", d.aluguel],
          ["EBITDA", d.ebitda],
          ["Lucro operacional", d.lucroOperacional],
          ["Lucro líquido", d.lucroLiquido],
        ],
      };
    }
    case "fluxo": {
      const fluxo = await listarFluxoCaixa({ dataInicio, dataFim });
      return {
        titulo: "Fluxo de caixa",
        colunas: ["Data", "Tipo", "Descrição", "Valor"],
        linhas: fluxo.map((f) => [
          f.flow_date,
          f.tipo,
          f.description,
          Number(f.amount),
        ]),
      };
    }
    case "receitas":
    case "clientes": {
      const ar = await listarContasReceber({ limit: 500 });
      return {
        titulo: tipo === "clientes" ? "Contas a receber" : "Receitas",
        colunas: ["Descrição", "Origem", "Vencimento", "Valor", "Recebido", "Status"],
        linhas: ar.map((c) => [
          c.description,
          c.source,
          c.due_date,
          Number(c.amount),
          Number(c.received_amount),
          c.status,
        ]),
      };
    }
    case "despesas":
    case "fornecedores": {
      const ap = await listarContasPagar({ limit: 500 });
      return {
        titulo: tipo === "fornecedores" ? "Contas a pagar" : "Despesas",
        colunas: ["Descrição", "Vencimento", "Valor", "Pago", "Juros", "Multa", "Status"],
        linhas: ap.map((c) => [
          c.description,
          c.due_date,
          Number(c.amount),
          Number(c.paid_amount),
          Number(c.interest_amount),
          Number(c.fine_amount),
          c.status,
        ]),
      };
    }
    case "lucro":
      return {
        titulo: "Lucro",
        colunas: ["Métrica", "Valor"],
        linhas: [
          ["Lucro líquido", dash.dre.lucroLiquido],
          ["EBITDA", dash.dre.ebitda],
          ["Margem líquida %", dash.dre.margemLiquidaPct],
        ],
      };
    case "cmv":
      return {
        titulo: "CMV",
        colunas: ["Métrica", "Valor"],
        linhas: [
          ["CMV", dash.kpis.cmv],
          ["CMV %", dash.kpis.cmvPct ?? 0],
          ["Faturamento", dash.kpis.faturamento],
        ],
      };
    default:
      return {
        titulo: "Relatório",
        colunas: ["Info"],
        linhas: [["Tipo não suportado"]],
      };
  }
}
