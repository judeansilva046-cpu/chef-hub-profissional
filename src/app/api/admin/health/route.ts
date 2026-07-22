import { NextResponse } from "next/server";

import { requireGestaoObservabilidade } from "@/server/observabilidade/require-gestao";
import { runSystemHealthCheck } from "@/server/observabilidade/health";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET() {
  try {
    await requireGestaoObservabilidade();
    const data = await comMedicao("GET /api/admin/health", "rota", () =>
      runSystemHealthCheck(),
    );
    const httpStatus =
      data.overall === "fail" ? 503 : data.overall === "degraded" ? 200 : 200;
    return NextResponse.json({ data }, { status: httpStatus });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro no health check.";
    const status = message.includes("restrito") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
