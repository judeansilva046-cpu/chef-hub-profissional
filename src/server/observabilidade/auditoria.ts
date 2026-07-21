import "server-only";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type AcaoAuditoria =
  | "login"
  | "logout"
  | "signup"
  | "criar"
  | "editar"
  | "excluir"
  | "status"
  | "pagamento"
  | "permissao"
  | "configuracao"
  | "outro";

export interface RegistrarAuditoriaInput {
  acao: AcaoAuditoria | string;
  entidade: string;
  registroId?: string | null;
  valorAnterior?: unknown;
  valorNovo?: unknown;
  empresaId?: string | null;
  metadados?: Record<string, unknown>;
}

async function requestContext(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null;
    return { ip, userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/**
 * Registra evento de auditoria (best-effort — nunca derruba a action principal).
 */
export async function registrarAuditoria(
  input: RegistrarAuditoriaInput,
): Promise<string | null> {
  try {
    const empresa =
      input.empresaId !== undefined
        ? { id: input.empresaId }
        : await getEmpresaAtual();
    const { ip, userAgent } = await requestContext();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("fn_registrar_auditoria", {
      p_empresa_id: empresa?.id ?? null,
      p_acao: input.acao,
      p_entidade: input.entidade,
      p_registro_id: input.registroId ?? undefined,
      p_valor_anterior:
        input.valorAnterior === undefined
          ? undefined
          : (input.valorAnterior as never),
      p_valor_novo:
        input.valorNovo === undefined ? undefined : (input.valorNovo as never),
      p_ip: ip ?? undefined,
      p_user_agent: userAgent ?? undefined,
      p_metadados: (input.metadados ?? {}) as never,
    });

    if (error) {
      console.error("[auditoria]", error.message);
      return null;
    }
    return data as string;
  } catch (error) {
    console.error("[auditoria]", error);
    return null;
  }
}
