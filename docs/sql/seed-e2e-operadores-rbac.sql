-- Seed opcional: operadores E2E para testes de RBAC (Sprint 06).
--
-- Pré-requisito: criar 3 usuários em Authentication (Supabase Dashboard)
-- com e-mail confirmado e a mesma senha do owner de teste:
--
--   e2e-caixa@chefhub.local     / E2eTeste!2026Senha
--   e2e-cozinha@chefhub.local   / E2eTeste!2026Senha
--   e2e-garcom@chefhub.local    / E2eTeste!2026Senha
--
-- Depois rode este script no SQL Editor (como postgres / service role).
-- Empresa padrão dos e2e: fa43de88-a47d-4758-b137-7ee49fa40394

do $$
declare
  v_empresa_id uuid := 'fa43de88-a47d-4758-b137-7ee49fa40394';
  v_caixa_id uuid;
  v_cozinha_id uuid;
  v_garcom_id uuid;
begin
  if not exists (select 1 from empresas where id = v_empresa_id) then
    raise exception 'Empresa E2E % não encontrada', v_empresa_id;
  end if;

  select id into v_caixa_id from profiles where lower(email) = 'e2e-caixa@chefhub.local';
  select id into v_cozinha_id from profiles where lower(email) = 'e2e-cozinha@chefhub.local';
  select id into v_garcom_id from profiles where lower(email) = 'e2e-garcom@chefhub.local';

  if v_caixa_id is null or v_cozinha_id is null or v_garcom_id is null then
    raise exception
      'Crie antes os usuários Auth (caixa/cozinha/garçom) — profiles ausentes';
  end if;

  insert into membros_empresa (empresa_id, usuario_id, papel, ativo)
  values
    (v_empresa_id, v_caixa_id, 'caixa', true),
    (v_empresa_id, v_cozinha_id, 'cozinha', true),
    (v_empresa_id, v_garcom_id, 'garcom', true)
  on conflict (empresa_id, usuario_id) do update set
    papel = excluded.papel,
    ativo = true,
    atualizado_em = now();

  raise notice 'OK: operadores E2E vinculados à empresa %', v_empresa_id;
end;
$$;
