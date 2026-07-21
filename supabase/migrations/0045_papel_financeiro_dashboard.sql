-- Sprint 11: papel `financeiro` + escrita financeira para esse papel.
-- Pré-requisito: 0043 + 0044.

-- 1) Ampliar check de papel
alter table public.membros_empresa
  drop constraint if exists membros_empresa_papel_check;

alter table public.membros_empresa
  add constraint membros_empresa_papel_check
  check (papel in ('owner', 'gerente', 'financeiro', 'caixa', 'cozinha', 'garcom'));

-- 2) Convite aceita financeiro
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
  if v_papel_caller is distinct from 'owner' then
    raise exception 'Apenas o owner pode convidar membros';
  end if;

  if v_papel is null
    or v_papel not in ('owner', 'gerente', 'financeiro', 'caixa', 'cozinha', 'garcom')
  then
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

-- 3) Policies de escrita financeira: owner/gerente/financeiro
do $$
declare
  t text;
  tabelas text[] := array[
    'custos_fixos',
    'custos_variaveis',
    'metas_vendas',
    'canais_venda'
  ];
  expr text := $e$public.fn_papel_em(empresa_id, 'financeiro')$e$;
begin
  foreach t in array tabelas loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on public.%I', 'rbac_gestao_ins_' || t, t);
    execute format('drop policy if exists %I on public.%I', 'rbac_gestao_upd_' || t, t);
    execute format('drop policy if exists %I on public.%I', 'rbac_gestao_del_' || t, t);
    execute format('drop policy if exists %I on public.%I', 'rbac_fin_ins_' || t, t);
    execute format('drop policy if exists %I on public.%I', 'rbac_fin_upd_' || t, t);
    execute format('drop policy if exists %I on public.%I', 'rbac_fin_del_' || t, t);

    execute format(
      $p$create policy %I on public.%I as restrictive for insert to authenticated with check (%s)$p$,
      'rbac_fin_ins_' || t, t, expr
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for update to authenticated using (%s) with check (%s)$p$,
      'rbac_fin_upd_' || t, t, expr, expr
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for delete to authenticated using (%s)$p$,
      'rbac_fin_del_' || t, t, expr
    );
  end loop;
end;
$$;
