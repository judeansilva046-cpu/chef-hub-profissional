import { type NextRequest, NextResponse } from "next/server";

import {
  gerarSugestoesCompra,
  perguntarIaCompras,
  registrarPerdaEstoque,
} from "@/features/estoque/inteligente/actions";
import {
  carregarDashboardEstoqueInteligente,
  listarBatchesInteligentes,
  listarPerdasEstoque,
  listarSugestoesCompra,
} from "@/features/estoque/inteligente/queries";
import { requirePapel } from "@/server/auth/require-papel";
import { comMedicao } from "@/server/observabilidade/logs";

type Params = { params: Promise<{ tipo: string }> };

const TIPOS_GET = new Set([
  "analytics",
  "abc",
  "consumo",
  "previsoes",
  "sugestoes",
  "perdas",
  "lotes",
  "inventario",
  "compras",
  "giro",
  "cmv",
  "alertas",
]);

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requirePapel();
    const { tipo } = await params;
    if (!TIPOS_GET.has(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const horizonteDias = Number(searchParams.get("horizonteDias") ?? 7);
    const diasHistorico = Number(searchParams.get("diasHistorico") ?? 30);

    const payload = await comMedicao(
      `GET /api/estoque/inteligente/${tipo}`,
      "rota",
      async () => {
        if (tipo === "sugestoes") return { items: await listarSugestoesCompra() };
        if (tipo === "perdas") return { items: await listarPerdasEstoque() };
        if (tipo === "lotes") return { items: await listarBatchesInteligentes() };

        const dash = await carregarDashboardEstoqueInteligente({
          horizonteDias,
          diasHistorico,
        });

        switch (tipo) {
          case "abc":
            return { abc: dash.abc };
          case "consumo":
            return {
              consumos: dash.consumos,
              porCategoria: dash.consumoPorCategoria,
              porFornecedor: dash.consumoPorFornecedor,
            };
          case "previsoes":
            return { previsoes: dash.previsoes };
          case "compras":
            return { previsoes: dash.previsoes, sugestoesAbertas: dash.sugestoesAbertas };
          case "giro":
            return { giros: dash.giros };
          case "cmv":
            return { cmv: dash.cmv };
          case "alertas":
            return { alertas: dash.alertas };
          case "inventario":
            return {
              batchesAtivos: dash.batchesAtivos,
              alertas: dash.alertas,
              valorParado: dash.valorParado,
            };
          case "analytics":
          default:
            return dash;
        }
      },
    );

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    const status = message.includes("permissão") || message.includes("papel") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requirePapel();
    const { tipo } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const result = await comMedicao(
      `POST /api/estoque/inteligente/${tipo}`,
      "rota",
      async () => {
        if (tipo === "ia") {
          return perguntarIaCompras(body);
        }
        if (tipo === "perdas") {
          const id = await registrarPerdaEstoque(body);
          return { id };
        }
        if (tipo === "sugestoes" || tipo === "compras") {
          const quantidade = await gerarSugestoesCompra(body);
          return { quantidade };
        }
        throw new Error("Tipo POST inválido. Use ia, perdas ou sugestoes.");
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    const status = message.includes("inválid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
