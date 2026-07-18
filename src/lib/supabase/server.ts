import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Client Supabase para uso em Server Components, Server Actions e Route
 * Handlers. `setAll` pode falhar quando chamado a partir de um Server
 * Component (que não pode gravar cookies) — é seguro ignorar nesse caso
 * porque src/proxy.ts já garante o refresh da sessão em toda requisição.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component — ver comentário acima.
          }
        },
      },
    },
  );
}
