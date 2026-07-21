import { NextResponse } from "next/server";

import { conectarIntegracao } from "@/features/integracoes/actions";
import {
  apiError,
  requireIntegrationsApi,
} from "@/features/integracoes/api-auth";
import { comMedicao } from "@/server/observabilidade/logs";

export async function POST(request: Request) {
  try {
    await requireIntegrationsApi();
    const body = (await request.json()) as {
      provedor?: string;
      clientId?: string;
      clientSecret?: string;
      webhookSecret?: string;
    };

    const formData = new FormData();
    formData.set("provedor", body.provedor ?? "");
    formData.set("clientId", body.clientId ?? "");
    formData.set("clientSecret", body.clientSecret ?? "");
    if (body.webhookSecret) formData.set("webhookSecret", body.webhookSecret);

    const data = await comMedicao(
      "POST /api/integrations/connect",
      "rota",
      () => conectarIntegracao(undefined, formData),
    );

    if (data.formError || data.fieldErrors) {
      return NextResponse.json({ error: data }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
