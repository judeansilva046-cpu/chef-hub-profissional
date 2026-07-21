-- Local development seed, applied automatically by the Supabase CLI on
-- `supabase start` / `supabase db reset` (see supabase/config.toml [db.seed]).
--
-- The migrations in supabase/migrations/* intentionally do NOT grant table
-- DML to the anon/authenticated/service_role API roles: on the hosted Supabase
-- project (docs/DATABASE.md) those grants come from the project's default
-- privileges. The local CLI stack uses restrictive default privileges, so we
-- reproduce the hosted grants here. Row-level security (declared in the
-- migrations) is still what actually protects the data per empresa; these
-- grants only make the tables reachable by the API roles at all.
--
-- Function EXECUTE privileges are deliberately left untouched: the migrations
-- grant/revoke those explicitly (e.g. the SECURITY DEFINER "single write path"
-- functions), and a blanket grant would undo that hardening.

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
