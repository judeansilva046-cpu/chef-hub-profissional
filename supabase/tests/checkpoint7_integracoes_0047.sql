-- Checkpoint 7: Central de Integrações (0047)
-- Pré-requisito: 0043+ e 0047. JWT = owner da empresa.

do $$
declare
  v_user uuid := (select auth.uid());
  v_empresa uuid;
  v_integration uuid;
  v_count int;
begin
  if v_user is null then
    raise exception 'Defina request.jwt.claim.sub';
  end if;

  select id into v_empresa
  from public.empresas
  where id in (select public.fn_empresas_acessiveis())
  limit 1;

  if v_empresa is null then
    raise exception 'Sem empresa acessível';
  end if;

  if public.fn_papel_na_empresa(v_empresa) <> 'owner' then
    raise exception 'Checkpoint espera papel owner';
  end if;

  insert into public.integrations (empresa_id, provider, category, status)
  values (v_empresa, 'ifood', 'delivery', 'pending')
  on conflict (empresa_id, provider) do update
    set status = 'pending'
  returning id into v_integration;

  insert into public.integration_credentials (
    integration_id, empresa_id, ciphertext
  ) values (
    v_integration, v_empresa, 'iv.tag.cipher-not-real'
  )
  on conflict (integration_id) do update
    set ciphertext = excluded.ciphertext;

  insert into public.integration_logs (
    integration_id, empresa_id, level, event_type, message
  ) values (
    v_integration, v_empresa, 'INFO', 'checkpoint', 'ok'
  );

  select count(*) into v_count
  from public.integrations
  where empresa_id = v_empresa and id = v_integration;

  if v_count <> 1 then
    raise exception 'Integração não visível para a própria empresa';
  end if;

  raise notice 'OK: checkpoint 7 passou';
end;
$$;
