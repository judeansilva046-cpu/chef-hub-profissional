import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type NivelLog = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface RegistrarLogInput {
  nivel: NivelLog;
  modulo: string;
  mensagem: string;
  detalhes?: Record<string, unknown>;
  empresaId?: string | null;
  duracaoMs?: number;
}

export async function registrarLog(input: RegistrarLogInput): Promise<void> {
  try {
    const empresa =
      input.empresaId !== undefined
        ? { id: input.empresaId }
        : await getEmpresaAtual();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("system_logs").insert({
      empresa_id: empresa?.id ?? null,
      nivel: input.nivel,
      modulo: input.modulo,
      mensagem: input.mensagem,
      detalhes: (input.detalhes ?? {}) as never,
      usuario_id: user?.id ?? null,
      duracao_ms: input.duracaoMs ?? null,
    });

    if (error) console.error("[system_logs]", error.message);
  } catch (error) {
    console.error("[system_logs]", error);
  }
}

export async function comMedicao<T>(
  nome: string,
  tipo: "rota" | "rpc" | "sql" | "render",
  fn: () => Promise<T>,
  limiarMs = 300,
): Promise<T> {
  const inicio = Date.now();
  try {
    return await fn();
  } finally {
    const duracao = Date.now() - inicio;
    if (duracao >= limiarMs) {
      void registrarPerformance({ tipo, nome, duracaoMs: duracao });
      void registrarLog({
        nivel: "WARNING",
        modulo: "performance",
        mensagem: `${tipo} lenta: ${nome} (${duracao}ms)`,
        detalhes: { tipo, nome, duracaoMs: duracao },
        duracaoMs: duracao,
      });
    }
  }
}

export async function registrarPerformance(input: {
  tipo: "rota" | "rpc" | "sql" | "render";
  nome: string;
  duracaoMs: number;
  metadados?: Record<string, unknown>;
}): Promise<void> {
  try {
    const empresa = await getEmpresaAtual();
    const supabase = await createClient();
    const { error } = await supabase.from("performance_samples").insert({
      empresa_id: empresa?.id ?? null,
      tipo: input.tipo,
      nome: input.nome,
      duracao_ms: input.duracaoMs,
      metadados: (input.metadados ?? {}) as never,
    });
    if (error) console.error("[performance]", error.message);
  } catch (error) {
    console.error("[performance]", error);
  }
}
