"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requirePapel } from "@/server/auth/require-papel";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";

import { montarContextoChefHubAi } from "./context";
import { responderChefHubAi } from "./engine";
import { PAPEIS_AI_LEITURA } from "./permissions";
import type { ChefHubAiResposta } from "./types";

const schema = z.object({
  pergunta: z.string().trim().min(3).max(500),
});

export async function perguntarChefHubAi(
  input: unknown,
): Promise<ChefHubAiResposta> {
  await requirePapel(...PAPEIS_AI_LEITURA);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Pergunta inválida.");
  }

  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Empresa não encontrada.");

  const ctx = await montarContextoChefHubAi();
  const resposta = responderChefHubAi(parsed.data.pergunta, ctx);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  try {
    await supabase.from("ai_query_logs").insert({
      empresa_id: empresa.id,
      user_id: userData.user?.id ?? null,
      pergunta: resposta.pergunta,
      intencao: resposta.intencao,
      resposta: resposta.resposta,
      explicacao: resposta.explicacao,
      fontes: resposta.fontes,
      metadata: {
        periodoAtual: ctx.periodoAtual,
        periodoAnterior: ctx.periodoAnterior,
      },
    });
  } catch {
    /* migration 0054 opcional */
  }

  void registrarAuditoria({
    acao: "consultar",
    entidade: "chefhub_ai",
    empresaId: empresa.id,
    metadados: { intencao: resposta.intencao },
  });

  return resposta;
}
