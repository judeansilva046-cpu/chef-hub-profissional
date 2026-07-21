import { NextResponse } from "next/server";

import { listarLogsIntegracao } from "@/features/integracoes/queries";
import {
  apiError,
  requireIntegrationsApi,
} from "@/features/integracoes/api-auth";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET(request: Request) {
  try {
    await requireIntegrationsApi();
    const { searchParams } = new URL(request.url);
    const data = await comMedicao("GET /api/integrations/logs", "rota", () =>
      listarLogsIntegracao({
        integrationId: searchParams.get("integrationId") ?? undefined,
        limit: Number(searchParams.get("limit") ?? 40) || 40,
      }),
    );
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
