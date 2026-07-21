-- Checkpoint 6: observabilidade/auditoria (0046)
-- Pré-requisito: migrations 0043+ e 0046 aplicadas.
-- Defina o JWT do usuário owner da empresa A:
--   select set_config('request.jwt.claim.sub', '<user-uuid>', true);

do $$
declare
  v_empresa_a uuid;
  v_empresa_b uuid;
  v_user uuid := (select auth.uid());
  v_audit uuid;
  v_count int;
begin
  if v_user is null then
    raise exception 'Defina request.jwt.claim.sub com um usuário autenticado';
  end if;

  select id into v_empresa_a
  from public.empresas
  where id in (select public.fn_empresas_acessiveis())
  limit 1;

  if v_empresa_a is null then
    raise exception 'Usuário sem empresa acessível';
  end if;

  -- Insere auditoria via RPC
  v_audit := public.fn_registrar_auditoria(
    v_empresa_a,
    'criar',
    'pedidos',
    'checkpoint-pedido',
    null,
    '{"status":"rascunho"}'::jsonb,
    '127.0.0.1',
    'checkpoint/6',
    '{}'::jsonb
  );

  if v_audit is null then
    raise exception 'fn_registrar_auditoria não retornou id';
  end if;

  select count(*) into v_count
  from public.auditoria_eventos
  where id = v_audit and empresa_id = v_empresa_a;

  if v_count <> 1 then
    raise exception 'Auditoria não visível para a própria empresa';
  end if;

  -- Isolamento: não deve ver auditoria de outra empresa (se existir)
  select id into v_empresa_b
  from public.empresas
  where id <> v_empresa_a
  limit 1;

  if v_empresa_b is not null then
    select count(*) into v_count
    from public.auditoria_eventos
    where empresa_id = v_empresa_b;

    if v_count > 0 and public.fn_papel_na_empresa(v_empresa_b) is null then
      raise exception 'Vazamento: visualizou auditoria de empresa sem acesso';
    end if;
  end if;

  -- Select de logs/alertas exige owner/gerente
  if public.fn_papel_na_empresa(v_empresa_a) not in ('owner', 'gerente') then
    raise exception 'Checkpoint espera owner/gerente na empresa A';
  end if;

  insert into public.system_logs (empresa_id, nivel, modulo, mensagem)
  values (v_empresa_a, 'INFO', 'checkpoint', 'ok');

  insert into public.system_alerts (
    empresa_id, tipo, severidade, titulo, mensagem
  ) values (
    v_empresa_a, 'api_lenta', 'warning', 'Checkpoint', 'teste'
  );

  raise notice 'OK: checkpoint 6 passou';
end;
$$;
