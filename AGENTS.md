<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Standard scripts live in `package.json` (`dev` on port **3010**, `build`, `start`, `lint`, `typecheck`, `format`); setup basics are in `README.md`. Notes below are the non-obvious bits.

### The app needs a Supabase backend to run

Every page/action/proxy reads `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`src/lib/supabase/*`, `src/proxy.ts`). Without a reachable Supabase, unauthenticated routes redirect to `/login` and authed routes error. There is no hosted project available here, so local dev uses the **Supabase CLI local stack** (Docker). Docker and the Supabase CLI are preinstalled in the VM image; `.env.local` (git-ignored) and `supabase/config.toml` already carry the local demo keys.

Start the backend before `npm run dev` or tests (services are NOT auto-started by the update script):

```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &   # only if `docker info` fails
sudo chmod 666 /var/run/docker.sock       # let non-root use the daemon
supabase start                            # applies supabase/migrations/* + supabase/seed.sql
node scripts/seed-e2e.mjs                 # seeds the Playwright e2e user/empresa/product
npm run dev                               # http://localhost:3010
```

`supabase start` prints the API URL/keys; they match `.env.local`. Studio is at `http://localhost:54323`.

### Non-obvious gotchas

- **Table grants**: the SQL migrations only `grant execute` on functions — they never grant table DML to `anon`/`authenticated`/`service_role`, relying on the hosted project's default privileges. The local CLI stack does NOT grant those by default, so the app (and service-role calls) get `permission denied` until grants are applied. `supabase/seed.sql` reproduces the hosted grants (`grant all on all tables/sequences ... to anon, authenticated, service_role`) and runs automatically on `supabase start`/`db reset`. Do not blanket-grant function EXECUTE — the migrations deliberately revoke it on internal/SECURITY DEFINER functions.
- **Email confirmation**: disabled in the local `config.toml` (`[auth.email] enable_confirmations = false`), so signup yields a session immediately — different from the hosted project where confirmation is on.
- **e2e data**: `e2e/fixtures.ts` expects a fixed user (`e2e-teste@chefhub.local`), empresa id, and products (`Produto E2E`, `Adicional E2E`). `scripts/seed-e2e.mjs` (idempotent) creates them via the Admin API + service-role client. A "product" in PDV/Pedidos is a `fichas_tecnicas` row (`disponivel_como_adicional=true` for add-ons), not a separate catalog.
- **Tests**: no `test` npm script — run the Playwright suite with `npx playwright test` (needs `npx playwright install chromium` once; browsers persist in the VM cache). The Playwright `webServer` reuses an already-running dev server.
- **Middleware**: this Next.js version has no `middleware.ts`; session refresh lives in `src/proxy.ts`.
