import { NextResponse } from "next/server";

import { buscarPedidoPorId } from "@/features/compras/queries";
import { gerarRelatorioPdf } from "@/features/relatorios/pdf";
import { formatarData, formatarDecimal, formatarMoeda } from "@/lib/format";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PDF de um único pedido de compra — Route Handler (não Server Action)
 * porque o resultado é um arquivo, reaproveita gerarRelatorioPdf genérico
 * (mesmo padrão de src/app/api/financeiro/exportar/[tipo]/route.ts).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const pedido = await buscarPedidoPorId(id);

  if (!pedido) {
    return new NextResponse("Pedido não encontrado.", { status: 404 });
  }

  const colunas = ["Ingrediente", "Quantidade", "Preço unitário", "Total"];
  const linhas: (string | number)[][] = pedido.pedidos_compra_itens.map((item) => [
    item.ingredientes.nome,
    `${formatarDecimal(item.quantidade_pedida)} ${item.ingredientes.unidades_medida.sigla}`,
    formatarMoeda(item.preco_unitario),
    formatarMoeda(item.valor_total ?? 0),
  ]);

  const desconto = pedido.desconto_valor_fixo + (pedido.subtotal * pedido.desconto_percentual) / 100;
  linhas.push(["", "", "Subtotal", formatarMoeda(pedido.subtotal)]);
  if (desconto > 0) linhas.push(["", "", "Desconto", `-${formatarMoeda(desconto)}`]);
  if (pedido.valor_frete > 0) linhas.push(["", "", "Frete", formatarMoeda(pedido.valor_frete)]);
  if (pedido.valor_impostos > 0) linhas.push(["", "", "Impostos", formatarMoeda(pedido.valor_impostos)]);
  linhas.push(["", "", "Total", formatarMoeda(pedido.total)]);

  const subtituloPartes = [
    `Fornecedor: ${pedido.fornecedores.nome}`,
    `Data: ${formatarData(pedido.data_pedido)}`,
    pedido.data_prevista_entrega ? `Previsão de entrega: ${formatarData(pedido.data_prevista_entrega)}` : null,
    pedido.condicao_pagamento
      ? `Pagamento: ${pedido.condicao_pagamento}${pedido.numero_parcelas > 1 ? ` em ${pedido.numero_parcelas}x` : ""}`
      : null,
  ].filter(Boolean);

  const pdf = await gerarRelatorioPdf({
    titulo: `Pedido de compra ${pedido.numero ? `#${pedido.numero}` : ""}`,
    subtitulo: subtituloPartes.join(" · "),
    colunas,
    linhas,
    colunasAlinhadasDireita: [2, 3],
  });

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pedido-compra-${pedido.numero ?? pedido.id.slice(0, 8)}.pdf"`,
    },
  });
}
