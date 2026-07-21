import { NextResponse } from "next/server";

import { listarAlertas } from "@/features/observabilidade/queries";
import {
  resolverAlerta,
  sincronizarAlertasOperacionais,
} from "@/server/observabilidade/alerts";
import { requireGestaoObservabilidade } from "@/server/observabilidade/require-gestao";
import { comMedicao } from "@/server/observabilidade/logs";

export async function GET(request: Request) {
  try {
    await requireGestaoObservabilidade();
    const { searchParams } = new URL(request.url);
    if (searchParams.get("sync") === "1") {
      await sincronizarAlertasOperacionais();
    }
    const data = await comMedicao("GET /api/admin/alerts", "rota", () =>
      listarAlertas({
        abertos: searchParams.get("todos") !== "1",
        limit: Number(searchParams.get("limit") ?? 50) || 50,
      }),
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar alertas.";
    const status = message.includes("restrito") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireGestaoObservabilidade();
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }
    const ok = await resolverAlerta(body.id);
    if (!ok) {
      return NextResponse.json(
        { error: "Não foi possível resolver o alerta." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao resolver alerta.";
    const status = message.includes("restrito") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
