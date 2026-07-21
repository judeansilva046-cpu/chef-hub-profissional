<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

The app is a Next.js 16 (App Router) SaaS backed by Supabase (Postgres + Auth).
Standard commands live in `README.md` / `package.json` (`dev`, `build`, `lint`,
`typecheck`, `format`). The web app runs on **port 3010**, not 3000.

### Services

- **Web (Next.js dev)**: `npm run dev` → http://localhost:3010 (Turbopack).
- **Supabase (local, via CLI)**: provides Postgres + Auth. Requires Docker.
  Not needed for `lint`/`typecheck`, but required to actually use the app
  (login/signup and every `(app)/*` route redirect to `/login` without it).

### Starting the local database (not in the update script)

Docker + the Supabase CLI are already installed in the base image. On a fresh
VM you typically only need:

1. Ensure the Docker daemon is running: `sudo dockerd &` then, once, make the
   socket usable without sudo: `sudo chmod 666 /var/run/docker.sock`.
2. `supabase start` — boots the stack and auto-applies every
   `supabase/migrations/*.sql` plus `supabase/seed.sql`. Use
   `supabase db reset` to rebuild from scratch. Studio: http://127.0.0.1:54323.

### Environment variables (`.env.local`, gitignored)

`.env.local` is required to run the app and is NOT committed. Populate it from
`supabase start` / `supabase status` output:

- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable key>`
- `SUPABASE_SERVICE_ROLE_KEY=<Secret key>`
- `INTEGRACOES_SECRET_KEY=<32-byte base64>` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)

Next.js does not hot-reload `.env.local`; restart `npm run dev` after editing it.

### Non-obvious gotchas

- **Local table permissions.** The hosted project (the intended workflow, per
  `docs/`) applies migrations as `supabase_admin`, whose default privileges
  grant full table access to `anon`/`authenticated` (row access is enforced by
  RLS). The local CLI applies migrations as `postgres`, whose default
  privileges do NOT — so without a fix every authenticated query fails with
  `permission denied ... (42501)`. `supabase/seed.sql` replicates the hosted
  grants and runs automatically on `supabase start` / `db reset`; keep it.
- **e2e tests need seed data.** `playwright.config.ts` + `e2e/fixtures.ts`
  expect a pre-created user (`e2e-teste@chefhub.local`) and a fixed
  `E2E_EMPRESA_ID` that exist only in the team's hosted Supabase project. They
  will NOT pass against a fresh local DB unless that user/empresa/product is
  seeded first. Signing up a fresh account through `/cadastro` → `/onboarding`
  is the quickest way to exercise auth + DB end to end locally.
