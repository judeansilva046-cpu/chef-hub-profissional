import { NextResponse } from "next/server";

import {
  apiError,
  requireIntegrationsApi,
} from "@/features/integracoes/api-auth";
import { processPendingWebhooks } from "@/features/integracoes/webhook-processor";
import { comMedicao } from "@/server/observabilidade/logs";

/**
 * Processa webhooks pendentes (reconciliação / worker manual).
 * POST /api/integrations/webhooks/process
 */
export async function POST(request: Request) {
  try {
    await requireIntegrationsApi();
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
    };
    const limit = Math.min(Math.max(body.limit ?? 50, 1), 200);

    const processed = await comMedicao(
      "POST /api/integrations/webhooks/process",
      "rota",
      () => processPendingWebhooks(limit),
    );

    return NextResponse.json({
      data: { processed },
      message: `${processed} webhook(s) processado(s).`,
    });
  } catch (error) {
    return apiError(error);
  }
}
