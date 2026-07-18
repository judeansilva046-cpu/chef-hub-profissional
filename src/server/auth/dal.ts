import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer: única fonte de verdade para "quem está logado" no lado
 * do servidor. Usa React cache() para deduplicar entre múltiplos componentes
 * na mesma renderização. Sempre chama redirect("/login") se não houver
 * sessão — nunca retorna um usuário nulo silenciosamente.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { user };
});

/** Para páginas públicas que só precisam saber SE há sessão, sem exigir. */
export const getOptionalUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});
