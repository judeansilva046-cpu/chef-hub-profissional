import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";
import { requireGestaoObservabilidade } from "@/server/observabilidade/require-gestao";
import { runSystemHealthCheck } from "@/server/observabilidade/health";
import { comMedicao } from "@/server/observabilidade/logs";
import { filtrarPorEmpresaId } from "@/features/observabilidade/permissions";

export async function GET() {
  try {
    await requireGestaoObservabilidade();
    const empresa = await requireEmpresaAtual();

    const data = await comMedicao("GET /api/admin/system", "rota", async () => {
      const health = await runSystemHealthCheck();
      const supabase = await createClient();
      const { data: samples } = await supabase
        .from("performance_samples")
        .select("id, tipo, nome, duracao_ms, criado_em, empresa_id")
        .eq("empresa_id", empresa.id)
        .order("criado_em", { ascending: false })
        .limit(30);

      return {
        health,
        performance: filtrarPorEmpresaId(samples ?? [], empresa.id),
        empresaId: empresa.id,
        version: health.version,
        build: health.build,
        environment: health.environment,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao obter status do sistema.";
    const status = message.includes("restrito") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
