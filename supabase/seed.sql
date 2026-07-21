-- Seed de desenvolvimento LOCAL (Supabase CLI). NÃO roda no projeto hospedado.
--
-- Por que existe: no Supabase hospedado, as tabelas do schema `public` são
-- criadas pelo papel `supabase_admin`, cujas DEFAULT PRIVILEGES concedem
-- acesso total (arwdDxtm) a `anon`/`authenticated`/`service_role` — o acesso
-- por linha fica a cargo da RLS. Já o Supabase CLI local aplica as migrations
-- como o papel `postgres`, cujas DEFAULT PRIVILEGES concedem só `Dxtm`
-- (truncate/references/trigger/maintain) — sem SELECT/INSERT/UPDATE/DELETE.
-- Sem os GRANTs abaixo, qualquer request autenticado bate em
-- "permission denied for table ..." (SQLSTATE 42501) no ambiente local.
--
-- Isto apenas replica localmente o comportamento padrão do ambiente
-- hospedado (a segurança real continua na RLS já definida nas migrations).
-- Os GRANTs de EXECUTE em funções são tratados nas próprias migrations
-- (com revokes intencionais para anon), então aqui NÃO mexemos em rotinas.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
