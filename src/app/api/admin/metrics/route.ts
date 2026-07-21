import { NextResponse } from "next/server";

import { getObservabilityMetrics } from "@/server/observabilidade/metrics";
import { requireGestaoObservabilidade } from "@/server/observabilidade/require-gestao";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET() {
  try {
    await requireGestaoObservabilidade();
    const data = await comMedicao("GET /api/admin/metrics", "rota", () =>
      getObservabilityMetrics(),
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao obter métricas.";
    const status = message.includes("restrito") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
