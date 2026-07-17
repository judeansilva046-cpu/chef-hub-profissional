-- Perfil público mínimo, espelhando auth.users. Nunca inserido diretamente pelo
-- cliente: só a trigger on_auth_user_created (SECURITY DEFINER) grava aqui,
-- porque não existe policy de INSERT para o role authenticated nesta tabela.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- SECURITY DEFINER: precisa ignorar RLS para poder inserir o perfil logo após o
-- signup, antes de existir qualquer sessão autenticada associada à linha nova.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome_completo, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome_completo', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
