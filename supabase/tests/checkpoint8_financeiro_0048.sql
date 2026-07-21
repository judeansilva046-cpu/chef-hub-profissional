-- Checkpoint 8: ERP financeiro (0048)
do $$
declare
  v_user uuid := (select auth.uid());
  v_empresa uuid;
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
    raise exception 'Sem empresa';
  end if;

  perform public.fn_seed_financeiro_defaults(v_empresa);

  select count(*) into v_count from public.cost_centers where empresa_id = v_empresa;
  if v_count < 7 then
    raise exception 'Seed de centros de custo incompleto';
  end if;

  insert into public.accounts_payable (
    empresa_id, description, competence_date, due_date, amount
  ) values (
    v_empresa, 'Checkpoint AP', current_date, current_date + 7, 100
  );

  insert into public.accounts_receivable (
    empresa_id, description, competence_date, due_date, amount, source
  ) values (
    v_empresa, 'Checkpoint AR', current_date, current_date + 7, 200, 'pix'
  );

  raise notice 'OK: checkpoint 8 passou';
end;
$$;
