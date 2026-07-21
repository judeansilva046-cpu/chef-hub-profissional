import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refresca o cookie de sessão do Supabase em toda requisição, antes que
 * Server Components rodem — sem isso, sessões expiram silenciosamente no
 * meio da navegação. Substitui middleware.ts no Next.js 16 (runtime nodejs
 * fixo, sem opção de edge runtime); precisa ficar em src/proxy.ts, no mesmo
 * nível de src/app, não na raiz do repositório.
 *
 * Isto é só a checagem OTIMISTA (lê/revalida o token). A autorização real
 * (quem pode ver o quê) acontece na RLS do Postgres e no DAL
 * (src/server/auth/dal.ts) — nunca confiar só nisto para proteger dados.
 *
 * Também propaga `x-pathname` para layouts server-side filtrarem rotas por
 * papel RBAC (ver `permissoes-rota.ts`).
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalida o token com o Auth server — diferente de getSession(),
  // que só lê o cookie sem verificar. Não remover nem trocar por getSession().
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
