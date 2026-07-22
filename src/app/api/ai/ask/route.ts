import { NextResponse } from "next/server";

import { perguntarChefHubAi } from "@/features/ai/actions";
import { podeUsarChefHubAi } from "@/features/ai/permissions";
import { getPapelNaEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { comMedicao } from "@/server/observabilidade/logs";

export async function POST(request: Request) {
  try {
    await requireEmpresaAtual();
    const papel = await getPapelNaEmpresaAtual();
    if (!papel || !podeUsarChefHubAi(papel)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = (await request.json()) as { pergunta?: string };
    const data = await comMedicao("POST /api/ai/ask", "rota", () =>
      perguntarChefHubAi({ pergunta: body.pergunta ?? "" }),
    );

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro no ChefHub AI.";
    const status = message.includes("permissão") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
