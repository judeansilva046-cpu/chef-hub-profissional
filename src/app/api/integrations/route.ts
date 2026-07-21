import { NextResponse } from "next/server";

import {
  listarCentralIntegracoes,
  obterStatusIntegracoes,
} from "@/features/integracoes/queries";
import {
  apiError,
  requireIntegrationsApi,
} from "@/features/integracoes/api-auth";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET(request: Request) {
  try {
    await requireIntegrationsApi();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as
      | "delivery"
      | "whatsapp"
      | "pix"
      | "printer"
      | "cardapio_digital"
      | null;

    const data = await comMedicao("GET /api/integrations", "rota", async () => {
      const [items, status] = await Promise.all([
        listarCentralIntegracoes(
          category ? { category } : undefined,
        ),
        obterStatusIntegracoes(),
      ]);
      return { items, status };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
