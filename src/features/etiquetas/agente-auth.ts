import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface AgenteAutenticado {
  agenteId: string;
  empresaId: string;
}

/**
 * Autenticação do agente local — Bearer da chave de API, validada contra o
 * hash em agentes_impressao (nunca a chave em texto puro é armazenada). Não
 * usa Supabase Auth/cookie porque o agente é um processo headless no
 * Windows, sem sessão de usuário. Roda com o client service-role — a
 * checagem de posse (agente ativo, empresa correta) é feita manualmente
 * aqui, mesmo princípio das funções SECURITY DEFINER do banco.
 */
export async function autenticarAgente(
  request: NextRequest,
): Promise<AgenteAutenticado | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const chave = authorization.slice("Bearer ".length).trim();
  if (!chave) return null;

  const chaveHash = createHash("sha256").update(chave).digest("hex");

  const supabase = createServiceRoleClient();
  const { data: agente, error } = await supabase
    .from("agentes_impressao")
    .select("id, empresa_id, ativo")
    .eq("chave_api_hash", chaveHash)
    .maybeSingle();

  if (error || !agente || !agente.ativo) return null;

  await supabase
    .from("agentes_impressao")
    .update({ ultimo_ping_em: new Date().toISOString() })
    .eq("id", agente.id);

  return { agenteId: agente.id, empresaId: agente.empresa_id };
}
