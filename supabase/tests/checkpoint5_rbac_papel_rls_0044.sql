-- Checkpoint 5: RLS por papel na escrita (migration 0044).
--
-- Pré-condições (mesma sessão):
--   select set_config('request.jwt.claim.sub', '<uuid do usuário dono>', false);
-- Migrations até 0044 aplicadas. Retorna 'OK: checkpoint 5 passou'.

do $$
declare
  v_empresa_id uuid;
  v_ok boolean;
begin
  select id into v_empresa_id from empresas limit 1;
  if v_empresa_id is null then
    raise exception 'Pré-condição: empresa';
  end if;

  if not fn_papel_em(v_empresa_id) then
    raise exception 'Falha: owner/gerente deveria passar em fn_papel_em sem papéis extras';
  end if;

  if not fn_papel_em(v_empresa_id, 'caixa') then
    raise exception 'Falha: owner deveria passar em fn_papel_em(..., caixa)';
  end if;

  -- Helpers existem e são executáveis
  perform fn_assert_papel(v_empresa_id);

  -- Policies restritivas de gestao criadas
  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'custos_fixos'
      and policyname like 'rbac_gestao_%'
      and permissive = 'RESTRICTIVE'
  ) into v_ok;

  if not v_ok then
    raise exception 'Falha: policies restritivas rbac_gestao_* em custos_fixos';
  end if;

  select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pedidos'
      and policyname like 'rbac_sala_%'
      and permissive = 'RESTRICTIVE'
  ) into v_ok;

  if not v_ok then
    raise exception 'Falha: policies restritivas rbac_sala_* em pedidos';
  end if;

  -- RPCs críticos viraram SECURITY DEFINER
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_iniciar_preparo_pedido'
      and p.prosecdef
  ) then
    raise exception 'Falha: fn_iniciar_preparo_pedido deveria ser SECURITY DEFINER';
  end if;

  raise notice 'OK: checkpoint 5 passou';
end;
$$;
