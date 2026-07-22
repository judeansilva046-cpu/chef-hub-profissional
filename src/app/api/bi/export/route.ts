import { type NextRequest, NextResponse } from "next/server";

import { formatBiValue } from "@/features/bi/calculations";
import { podeLerBi } from "@/features/bi/permissions";
import { carregarBiDashboard } from "@/features/bi/queries";
import type { BiDashboardId } from "@/features/bi/types";
import { gerarExcelXml } from "@/features/financeiro/erp/excel";
import { gerarCsv } from "@/features/relatorios/csv";
import { gerarPdfRelatorio } from "@/features/relatorios/pdf";
import {
  primeiroDiaDoMesAtual,
  ultimoDiaDoMesAtual,
} from "@/lib/periodo";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { comMedicao } from "@/server/observabilidade/logs";

type Formato = "csv" | "pdf" | "excel";

const DASHBOARDS = new Set<BiDashboardId>([
  "visao_geral",
  "financeiro",
  "vendas",
  "delivery",
  "salao",
  "estoque",
  "crm",
  "kds",
  "funcionarios",
  "metas",
]);

export async function GET(request: NextRequest) {
  try {
    await requireEmpresaAtual();
    const papel = await getPapelNaEmpresaAtual();
    if (!papel || !podeLerBi(papel)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dashboardRaw = searchParams.get("dashboard") ?? "visao_geral";
    const dashboard = (
      DASHBOARDS.has(dashboardRaw as BiDashboardId)
        ? dashboardRaw
        : "visao_geral"
    ) as BiDashboardId;
    const formato = (searchParams.get("formato") ?? "csv") as Formato;
    const dataInicio = searchParams.get("dataInicio") || primeiroDiaDoMesAtual();
    const dataFim = searchParams.get("dataFim") || ultimoDiaDoMesAtual();

    const { titulo, colunas, linhas } = await comMedicao(
      `GET /api/bi/export:${dashboard}`,
      "rota",
      async () => {
        const data = await carregarBiDashboard({
          dashboard,
          dataInicio,
          dataFim,
        });
        const colunasLocal = ["Indicador", "Valor", "Delta %"];
        const linhasLocal = data.kpis.map((k) => [
          k.label,
          formatBiValue(k.value, k.format),
          k.deltaPct != null ? String(k.deltaPct) : "",
        ]);
        for (const c of data.comparativos) {
          linhasLocal.push([
            `Comparativo: ${c.label}`,
            formatBiValue(c.atual, c.format),
            c.deltaPct != null ? String(c.deltaPct) : "",
          ]);
        }
        for (const m of data.metas) {
          linhasLocal.push([
            `Meta: ${m.tipo}`,
            `${m.valorAtual}/${m.valorMeta}`,
            String(m.progressoPct),
          ]);
        }
        return {
          titulo: `BI ${dashboard}`,
          colunas: colunasLocal,
          linhas: linhasLocal,
        };
      },
    );

    if (formato === "csv") {
      const body = gerarCsv(colunas, linhas);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="bi-${dashboard}.csv"`,
        },
      });
    }

    if (formato === "excel") {
      const body = gerarExcelXml(titulo, colunas, linhas);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="bi-${dashboard}.xls"`,
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
        "Content-Disposition": `attachment; filename="bi-${dashboard}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao exportar BI.";
    const status = message.includes("permissão") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
