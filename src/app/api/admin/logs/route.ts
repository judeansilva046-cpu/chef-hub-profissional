import { NextResponse } from "next/server";

import { listarLogs } from "@/features/observabilidade/queries";
import { requireGestaoObservabilidade } from "@/server/observabilidade/require-gestao";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET(request: Request) {
  try {
    await requireGestaoObservabilidade();
    const { searchParams } = new URL(request.url);
    const data = await comMedicao("GET /api/admin/logs", "rota", () =>
      listarLogs({
        limit: Number(searchParams.get("limit") ?? 100) || 100,
        nivel: searchParams.get("nivel") ?? undefined,
      }),
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar logs.";
    const status = message.includes("restrito") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
