import { NextResponse } from "next/server";

import { obterStatusIntegracoes } from "@/features/integracoes/queries";
import {
  apiError,
  requireIntegrationsApi,
} from "@/features/integracoes/api-auth";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET() {
  try {
    await requireIntegrationsApi();
    const data = await comMedicao(
      "GET /api/integrations/status",
      "rota",
      () => obterStatusIntegracoes(),
    );
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
