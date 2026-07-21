import { NextResponse } from "next/server";

import { desconectarIntegracao } from "@/features/integracoes/actions";
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

    await comMedicao("POST /api/integrations/disconnect", "rota", () =>
      desconectarIntegracao(body.integrationId!),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
