import { NextResponse } from "next/server";

import { calcularLimiarVip, calcularSegmentosCliente, calcularTicketMedioGeral, SEGMENTO_LABEL } from "@/features/crm-segmentacao/calculations";
import { buscarClientesComMetricas } from "@/features/crm-segmentacao/queries";
import { gerarExcel } from "@/features/relatorios/excel";
import { gerarRelatorioPdf } from "@/features/relatorios/pdf";
import { formatarData, formatarMoeda } from "@/lib/format";

/**
 * Exportação PDF/Excel de Clientes (CRM, Sprint 07) — mesmo padrão de
 * src/app/api/financeiro/exportar/[tipo]/route.ts (Sprint 06): Route
 * Handler (não Server Action) porque o resultado é um arquivo, reaproveita
 * gerarExcel/gerarRelatorioPdf genéricos.
 */
export async function GET(request: Request) {
  const formato = new URL(request.url).searchParams.get("formato") ?? "xlsx";

  const clientes = await buscarClientesComMetricas();
  const contexto = {
    limiarVip: calcularLimiarVip(clientes),
    ticketMedioGeral: calcularTicketMedioGeral(clientes),
  };

  const colunas = ["Nome", "Segmentos", "Total gasto", "Ticket médio", "Compras", "Última compra"];
  const linhas = clientes.map((cliente) => {
    const segmentos = calcularSegmentosCliente(cliente, contexto)
      .map((chave) => SEGMENTO_LABEL[chave])
      .join(", ");
    return [
      cliente.nome,
      segmentos || "—",
      formatarMoeda(cliente.totalGasto),
      formatarMoeda(cliente.ticketMedio),
      cliente.quantidadeCompras,
      cliente.ultimaCompra ? formatarData(cliente.ultimaCompra) : "—",
    ];
  });

  const nomeArquivo = `clientes-crm-${new Date().toISOString().slice(0, 10)}`;

  if (formato === "pdf") {
    const pdf = await gerarRelatorioPdf({
      titulo: "Clientes — CRM",
      subtitulo: `${clientes.length} cliente(s)`,
      colunas,
      linhas,
      colunasAlinhadasDireita: [2, 3, 4],
    });
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}.pdf"`,
      },
    });
  }

  const excel = await gerarExcel("Clientes", colunas, linhas);
  return new NextResponse(excel as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}.xlsx"`,
    },
  });
}
