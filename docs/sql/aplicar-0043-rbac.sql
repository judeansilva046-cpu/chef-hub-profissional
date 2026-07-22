-- Bundle: aplicar migration 0043 (RBAC multi-operador)
-- Fonte: supabase/migrations/0043_membros_empresa_rbac.sql
-- Aplique após 0040–0042.

-- Multi-operador RBAC: membros_empresa + helpers + rewrite de policies RLS
-- para que membros ativos acessem dados do tenant. Owner primário permanece
-- em empresas.usuario_id (UPDATE de empresas só para o owner).

-- ---------------------------------------------------------------------------
-- 1) Tabela membros_empresa
-- ---------------------------------------------------------------------------
create table public.membros_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  papel text not null default 'garcom' check (
    papel in ('owner', 'gerente', 'caixa', 'cozinha', 'garcom')
  ),
  ativo boolean not null default true,
  convidado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);

create index membros_empresa_usuario_ativo_idx
  on public.membros_empresa (usuario_id, ativo);
create index membros_empresa_empresa_ativo_idx
  on public.membros_empresa (empresa_id, ativo);

create trigger membros_empresa_set_atualizado_em
  before update on public.membros_empresa
  for each row execute function public.set_atualizado_em();

-- Backfill: um owner por empresa existente
insert into public.membros_empresa (empresa_id, usuario_id, papel)
select e.id, e.usuario_id, 'owner'
from public.empresas e
on conflict (empresa_id, usuario_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Trigger: ao criar empresa, cria membro owner automaticamente
-- ---------------------------------------------------------------------------
create or replace function public.empresas_after_insert_membro_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.membros_empresa (empresa_id, usuario_id, papel)
  values (new.id, new.usuario_id, 'owner')
  on conflict (empresa_id, usuario_id) do nothing;
  return new;
end;
$$;

create trigger empresas_after_insert_membro_owner
  after insert on public.empresas
  for each row execute function public.empresas_after_insert_membro_owner();

-- ---------------------------------------------------------------------------
-- 3) Proteção do owner primário (empresas.usuario_id)
-- ---------------------------------------------------------------------------
create or replace function public.membros_empresa_proteger_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  if tg_op = 'DELETE' then
    select usuario_id into v_owner_id
    from public.empresas
    where id = old.empresa_id;

    if v_owner_id is not null and old.usuario_id = v_owner_id then
      raise exception 'Não é possível remover o owner primário da empresa';
    end if;
    return old;
  end if;

  select usuario_id into v_owner_id
  from public.empresas
  where id = new.empresa_id;

  if v_owner_id is not null and new.usuario_id = v_owner_id then
    if new.ativo is distinct from true then
      raise exception 'Não é possível desativar o owner primário da empresa';
    end if;
    if new.papel is distinct from 'owner' then
      raise exception 'Não é possível alterar o papel do owner primário';
    end if;
  end if;

  return new;
end;
$$;

create trigger membros_empresa_proteger_owner_upd
  before update on public.membros_empresa
  for each row execute function public.membros_empresa_proteger_owner();

create trigger membros_empresa_proteger_owner_del
  before delete on public.membros_empresa
  for each row execute function public.membros_empresa_proteger_owner();

-- ---------------------------------------------------------------------------
-- 4) Helpers RBAC (SECURITY DEFINER — bypass RLS ao ler membros/empresas)
-- ---------------------------------------------------------------------------
create or replace function public.fn_empresas_acessiveis()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.empresas
  where usuario_id = (select auth.uid())
  union
  select empresa_id
  from public.membros_empresa
  where usuario_id = (select auth.uid())
    and ativo = true;
$$;

create or replace function public.fn_usuario_acessa_empresa(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.fn_empresas_acessiveis() as e(id)
    where e.id = p_empresa_id
  );
$$;

create or replace function public.fn_papel_na_empresa(p_empresa_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.empresas
      where id = p_empresa_id
        and usuario_id = (select auth.uid())
    ) then 'owner'
    else (
      select m.papel
      from public.membros_empresa m
      where m.empresa_id = p_empresa_id
        and m.usuario_id = (select auth.uid())
        and m.ativo = true
    )
  end;
$$;

revoke all on function public.fn_empresas_acessiveis() from public, anon;
revoke all on function public.fn_usuario_acessa_empresa(uuid) from public, anon;
revoke all on function public.fn_papel_na_empresa(uuid) from public, anon;
grant execute on function public.fn_empresas_acessiveis() to authenticated;
grant execute on function public.fn_usuario_acessa_empresa(uuid) to authenticated;
grant execute on function public.fn_papel_na_empresa(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5) Convidar membro por e-mail (profiles.email espelha auth.users)
-- ---------------------------------------------------------------------------
create or replace function public.fn_convidar_membro_por_email(
  p_empresa_id uuid,
  p_email text,
  p_papel text default 'garcom'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_papel_caller text;
  v_usuario_id uuid;
  v_membro_id uuid;
  v_papel text := lower(trim(p_papel));
begin
  if (select auth.uid()) is null then
    raise exception 'Não autenticado';
  end if;

  if not public.fn_usuario_acessa_empresa(p_empresa_id) then
    raise exception 'Empresa não encontrada ou sem acesso';
  end if;

  v_papel_caller := public.fn_papel_na_empresa(p_empresa_id);
  if v_papel_caller is null or v_papel_caller not in ('owner', 'gerente') then
    raise exception 'Apenas owner ou gerente podem convidar membros';
  end if;

  if v_papel is null or v_papel not in ('owner', 'gerente', 'caixa', 'cozinha', 'garcom') then
    raise exception 'Papel inválido';
  end if;

  select p.id into v_usuario_id
  from public.profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1;

  if v_usuario_id is null then
    raise exception 'Usuário precisa criar conta no Chef Hub primeiro com este e-mail.';
  end if;

  insert into public.membros_empresa (
    empresa_id, usuario_id, papel, convidado_por, ativo
  )
  values (
    p_empresa_id,
    v_usuario_id,
    v_papel,
    (select auth.uid()),
    true
  )
  on conflict (empresa_id, usuario_id) do update set
    papel = excluded.papel,
    ativo = true,
    convidado_por = excluded.convidado_por,
    atualizado_em = now()
  returning id into v_membro_id;

  return v_membro_id;
end;
$$;

revoke all on function public.fn_convidar_membro_por_email(uuid, text, text) from public, anon;
grant execute on function public.fn_convidar_membro_por_email(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Rewrite dinâmico de policies (pg_policies)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_qual text;
  v_check text;
  v_new_qual text;
  v_new_check text;
  v_roles text;
  v_using_sql text;
  v_check_sql text;
  v_changed boolean;
begin
  for r in
    select
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    from pg_policies
    where schemaname = 'public'
      -- empresas: SELECT/UPDATE tratados explicitamente abaixo
      and not (tablename = 'empresas')
      and not (tablename = 'membros_empresa')
  loop
    v_qual := r.qual;
    v_check := r.with_check;
    v_new_qual := v_qual;
    v_new_check := v_check;
    v_changed := false;

    -- Subconsultas clássicas de ownership por empresa_id
    if v_new_qual is not null then
      v_new_qual := regexp_replace(
        v_new_qual,
        'empresa_id\s+in\s*\(\s*select\s+(?:public\.)?empresas\.id\s+from\s+(?:public\.)?empresas\s+where\s+\(?\s*(?:public\.)?empresas\.usuario_id\s*=\s*\(?\s*select\s+auth\.uid\(\)(?:\s+as\s+\w+)?\s*\)?\s*\)?\s*\)',
        'empresa_id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_qual := regexp_replace(
        v_new_qual,
        'empresa_id\s+in\s*\(\s*select\s+id\s+from\s+(?:public\.)?empresas\s+where\s+usuario_id\s*=\s*\(?\s*select\s+auth\.uid\(\)\s*\)?\s*\)',
        'empresa_id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_qual := regexp_replace(
        v_new_qual,
        'empresa_id\s+in\s*\(\s*select\s+id\s+from\s+(?:public\.)?empresas\s+where\s+usuario_id\s*=\s*auth\.uid\(\)\s*\)',
        'empresa_id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      -- Joins: e.usuario_id = auth.uid() / (select auth.uid())
      v_new_qual := regexp_replace(
        v_new_qual,
        '([a-z_][a-z0-9_]*)\.usuario_id\s*=\s*\(?\s*select\s+auth\.uid\(\)\s*\)?',
        '\1.id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_qual := regexp_replace(
        v_new_qual,
        '([a-z_][a-z0-9_]*)\.usuario_id\s*=\s*auth\.uid\(\)',
        '\1.id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
    end if;

    if v_new_check is not null then
      v_new_check := regexp_replace(
        v_new_check,
        'empresa_id\s+in\s*\(\s*select\s+(?:public\.)?empresas\.id\s+from\s+(?:public\.)?empresas\s+where\s+\(?\s*(?:public\.)?empresas\.usuario_id\s*=\s*\(?\s*select\s+auth\.uid\(\)(?:\s+as\s+\w+)?\s*\)?\s*\)?\s*\)',
        'empresa_id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_check := regexp_replace(
        v_new_check,
        'empresa_id\s+in\s*\(\s*select\s+id\s+from\s+(?:public\.)?empresas\s+where\s+usuario_id\s*=\s*\(?\s*select\s+auth\.uid\(\)\s*\)?\s*\)',
        'empresa_id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_check := regexp_replace(
        v_new_check,
        'empresa_id\s+in\s*\(\s*select\s+id\s+from\s+(?:public\.)?empresas\s+where\s+usuario_id\s*=\s*auth\.uid\(\)\s*\)',
        'empresa_id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_check := regexp_replace(
        v_new_check,
        '([a-z_][a-z0-9_]*)\.usuario_id\s*=\s*\(?\s*select\s+auth\.uid\(\)\s*\)?',
        '\1.id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
      v_new_check := regexp_replace(
        v_new_check,
        '([a-z_][a-z0-9_]*)\.usuario_id\s*=\s*auth\.uid\(\)',
        '\1.id in (select public.fn_empresas_acessiveis())',
        'gi'
      );
    end if;

    v_changed :=
      (v_qual is distinct from v_new_qual)
      or (v_check is distinct from v_new_check);

    if not v_changed then
      continue;
    end if;

    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname,
      r.schemaname,
      r.tablename
    );

    select string_agg(quote_ident(role_name), ', ')
    into v_roles
    from unnest(r.roles) as role_name;

    if v_roles is null or v_roles = '' then
      v_roles := 'public';
    end if;

    v_using_sql := case
      when v_new_qual is not null then 'using (' || v_new_qual || ')'
      else ''
    end;
    v_check_sql := case
      when v_new_check is not null then 'with check (' || v_new_check || ')'
      else ''
    end;

    execute format(
      'create policy %I on %I.%I as %s for %s to %s %s %s',
      r.policyname,
      r.schemaname,
      r.tablename,
      case when r.permissive = 'PERMISSIVE' then 'permissive' else 'restrictive' end,
      lower(r.cmd),
      v_roles,
      v_using_sql,
      v_check_sql
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 7) Policies explícitas: empresas + membros_empresa + profiles co-membros
-- ---------------------------------------------------------------------------
drop policy if exists "empresas_select_own" on public.empresas;
create policy "empresas_select_own" on public.empresas
  for select using (
    id in (select public.fn_empresas_acessiveis())
  );

-- UPDATE permanece owner-only (empresas.usuario_id)
-- INSERT permanece inalterado (criador vira owner via trigger)

alter table public.membros_empresa enable row level security;

create policy "membros_empresa_select_acessivel" on public.membros_empresa
  for select using (
    empresa_id in (select public.fn_empresas_acessiveis())
  );

create policy "membros_empresa_insert_gestao" on public.membros_empresa
  for insert with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and (
      public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
      or exists (
        select 1 from public.empresas e
        where e.id = empresa_id and e.usuario_id = (select auth.uid())
      )
    )
  );

create policy "membros_empresa_update_gestao" on public.membros_empresa
  for update using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and (
      public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
      or exists (
        select 1 from public.empresas e
        where e.id = empresa_id and e.usuario_id = (select auth.uid())
      )
    )
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and (
      public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
      or exists (
        select 1 from public.empresas e
        where e.id = empresa_id and e.usuario_id = (select auth.uid())
      )
    )
  );

create policy "membros_empresa_delete_gestao" on public.membros_empresa
  for delete using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and (
      public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
      or exists (
        select 1 from public.empresas e
        where e.id = empresa_id and e.usuario_id = (select auth.uid())
      )
    )
  );

-- Co-membros podem ver nome/e-mail uns dos outros (lista de equipe)
drop policy if exists "profiles_select_co_membros" on public.profiles;
create policy "profiles_select_co_membros" on public.profiles
  for select using (
    id in (
      select m.usuario_id
      from public.membros_empresa m
      where m.empresa_id in (select public.fn_empresas_acessiveis())
    )
  );

-- ---------------------------------------------------------------------------
-- 8) SECURITY DEFINER: ownership checks → fn_usuario_acessa_empresa
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_def text;
  v_new text;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and pg_get_functiondef(p.oid) ~ 'usuario_id\s*=\s*auth\.uid\(\)'
      and p.proname not in (
        'fn_empresas_acessiveis',
        'fn_usuario_acessa_empresa',
        'fn_papel_na_empresa',
        'fn_convidar_membro_por_email',
        'empresas_after_insert_membro_owner',
        'membros_empresa_proteger_owner',
        'handle_new_user'
      )
  loop
    v_def := pg_get_functiondef(r.oid);
    v_new := v_def;

    -- exists (select 1 from empresas where id = <expr> and usuario_id = auth.uid())
    v_new := regexp_replace(
      v_new,
      'exists\s*\(\s*select\s+1\s+from\s+(?:public\.)?empresas\s+where\s+id\s*=\s*([a-zA-Z0-9_.]+)\s+and\s+usuario_id\s*=\s*auth\.uid\(\)\s*\)',
      'public.fn_usuario_acessa_empresa(\1)',
      'gi'
    );

    -- select 1 from empresas where id = <expr> and usuario_id = auth.uid()
    -- (dentro de if not exists (...))
    v_new := regexp_replace(
      v_new,
      'select\s+1\s+from\s+(?:public\.)?empresas\s+where\s+id\s*=\s*([a-zA-Z0-9_.]+)\s+and\s+usuario_id\s*=\s*auth\.uid\(\)',
      'select 1 where public.fn_usuario_acessa_empresa(\1)',
      'gi'
    );

    -- Multiline variant used by fn_proximo_numero_pedido
    v_new := regexp_replace(
      v_new,
      'select\s+1\s+from\s+(?:public\.)?empresas\s+where\s+id\s*=\s*([a-zA-Z0-9_.]+)\s+and\s+usuario_id\s*=\s*auth\.uid\(\)',
      'select 1 where public.fn_usuario_acessa_empresa(\1)',
      'gi'
    );

    if v_new is distinct from v_def then
      execute v_new;
    end if;
  end loop;
end $$;
