import { NextResponse } from "next/server";

import { testarConexaoIntegracao } from "@/features/integracoes/actions";
import {
  apiError,
  requireIntegrationsApi,
} from "@/features/integracoes/api-auth";
import { comMedicao } from "@/server/observabilidade/logs";

export async function POST(request: Request) {
  try {
    await requireIntegrationsApi();
    const body = (await request.json()) as { integrationId?: string };
    if (!body.integrationId) {
      return NextResponse.json(
        { error: "integrationId obrigatório" },
        { status: 400 },
      );
    }

    const data = await comMedicao("POST /api/integrations/test", "rota", () =>
      testarConexaoIntegracao(body.integrationId!),
    );

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
