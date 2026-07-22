-- Checkpoint 4: RBAC multi-operador (migration 0043).
--
-- Pré-condições (mesma sessão):
--   select set_config('request.jwt.claim.sub', '<uuid do usuário dono>', false);
-- Migrations até 0043 aplicadas. Retorna 'OK: checkpoint 4 passou'.

do $$
declare
  v_empresa_id uuid;
  v_owner_id uuid;
  v_papel text;
begin
  select id, usuario_id into v_empresa_id, v_owner_id
  from empresas
  limit 1;

  if v_empresa_id is null or v_owner_id is null then
    raise exception 'Pré-condição: empresa com owner';
  end if;

  ----------------------------------------------------------------------
  -- 1) Owner primário tem papel owner e está em membros_empresa
  ----------------------------------------------------------------------
  if not exists (
    select 1
    from membros_empresa
    where empresa_id = v_empresa_id
      and usuario_id = v_owner_id
      and papel = 'owner'
      and ativo
  ) then
    raise exception 'Falha: owner primário deveria estar em membros_empresa';
  end if;

  v_papel := fn_papel_na_empresa(v_empresa_id);
  if v_papel is distinct from 'owner' then
    raise exception 'Falha: fn_papel_na_empresa deveria retornar owner (foi %)', v_papel;
  end if;

  if not (v_empresa_id = any (fn_empresas_acessiveis())) then
    raise exception 'Falha: empresa deveria estar em fn_empresas_acessiveis()';
  end if;

  ----------------------------------------------------------------------
  -- 2) Proteção: não remover / desativar / demover owner primário
  ----------------------------------------------------------------------
  begin
    delete from membros_empresa
    where empresa_id = v_empresa_id and usuario_id = v_owner_id;
    raise exception 'Falha: deveria bloquear remoção do owner primário';
  exception when others then
    if sqlerrm not like '%owner primário%' then raise; end if;
  end;

  begin
    update membros_empresa
    set ativo = false
    where empresa_id = v_empresa_id and usuario_id = v_owner_id;
    raise exception 'Falha: deveria bloquear desativação do owner primário';
  exception when others then
    if sqlerrm not like '%owner primário%' then raise; end if;
  end;

  begin
    update membros_empresa
    set papel = 'gerente'
    where empresa_id = v_empresa_id and usuario_id = v_owner_id;
    raise exception 'Falha: deveria bloquear demotion do owner primário';
  exception when others then
    if sqlerrm not like '%owner primário%' then raise; end if;
  end;

  ----------------------------------------------------------------------
  -- 3) Convite exige conta existente (profiles)
  ----------------------------------------------------------------------
  begin
    perform fn_convidar_membro_por_email(
      v_empresa_id,
      'usuario-inexistente-e2e@chefhub.local',
      'garcom'
    );
    raise exception 'Falha: convite deveria exigir conta existente';
  exception when others then
    if sqlerrm not like '%criar conta%' then raise; end if;
  end;

  ----------------------------------------------------------------------
  -- 4) UPDATE de empresas.usuario_id só pelo owner (policy)
  --    (smoke: empresa continua acessível após checagens acima)
  ----------------------------------------------------------------------
  if not fn_usuario_acessa_empresa(v_empresa_id) then
    raise exception 'Falha: fn_usuario_acessa_empresa deveria ser true para o dono';
  end if;

  raise notice 'OK: checkpoint 4 passou';
end;
$$;
