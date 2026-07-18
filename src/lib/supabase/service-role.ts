import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Client com a service-role key — bypassa RLS por completo. Só duas
 * chamadoras legítimas neste projeto: as Route Handlers do agente local de
 * impressão (src/app/api/agente-impressao/**) e do webhook de integrações
 * (src/app/api/webhooks/**), porque nenhuma das duas tem uma sessão
 * Supabase Auth normal (o agente local autentica com uma chave de API
 * própria; o provedor externo não autentica como usuário nenhum). As duas
 * fazem a checagem de posse/autorização manualmente antes de qualquer
 * leitura/escrita — mesmo princípio das funções SECURITY DEFINER do banco
 * (ver docs/DATABASE.md).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — necessária para a API do agente local e para os webhooks de integração.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
