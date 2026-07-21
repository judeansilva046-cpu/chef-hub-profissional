-- Sprint 06 complemento: RLS por papel na escrita + asserts em RPCs
-- operacionais. SELECT permanece por tenant (fn_empresas_acessiveis);
-- mutações diretas de back-office exigem owner/gerente.

-- ---------------------------------------------------------------------------
-- 1) Helpers
-- ---------------------------------------------------------------------------
create or replace function public.fn_papel_em(
  p_empresa_id uuid,
  variadic p_papeis text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_empresa_id is null then false
    when public.fn_papel_na_empresa(p_empresa_id) in ('owner', 'gerente') then true
    when p_papeis is null or cardinality(p_papeis) = 0 then false
    else public.fn_papel_na_empresa(p_empresa_id) = any (p_papeis)
  end;
$$;

create or replace function public.fn_assert_papel(
  p_empresa_id uuid,
  variadic p_papeis text[]
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Não autenticado';
  end if;
  if p_empresa_id is null or not public.fn_usuario_acessa_empresa(p_empresa_id) then
    raise exception 'Empresa não encontrada ou sem acesso';
  end if;
  if not public.fn_papel_em(p_empresa_id, variadic p_papeis) then
    raise exception 'Você não tem permissão para esta ação.';
  end if;
end;
$$;

create or replace function public.fn_assert_papel_pedido(
  p_pedido_id uuid,
  variadic p_papeis text[]
)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
begin
  select empresa_id into v_empresa_id
  from public.pedidos
  where id = p_pedido_id;

  if v_empresa_id is null then
    raise exception 'Pedido não encontrado';
  end if;

  perform public.fn_assert_papel(v_empresa_id, variadic p_papeis);
end;
$$;

revoke all on function public.fn_papel_em(uuid, text[]) from public, anon;
revoke all on function public.fn_assert_papel(uuid, text[]) from public, anon;
revoke all on function public.fn_assert_papel_pedido(uuid, text[]) from public, anon;
grant execute on function public.fn_papel_em(uuid, text[]) to authenticated;
grant execute on function public.fn_assert_papel(uuid, text[]) to authenticated;
grant execute on function public.fn_assert_papel_pedido(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Patch RPCs: SECURITY DEFINER + assert de papel
-- ---------------------------------------------------------------------------
do $patch$
declare
  r record;
  v_def text;
  v_new text;
begin
  for r in
    select *
    from (values
      ('fn_confirmar_pedido(uuid)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa', 'garcom');$a$),
      ('fn_iniciar_preparo_pedido(uuid)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa', 'garcom', 'cozinha');$a$),
      ('fn_concluir_pedido(uuid)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa', 'garcom');$a$),
      ('fn_cancelar_pedido(uuid, text)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa', 'garcom');$a$),
      ('fn_avancar_status_pedido(uuid, text)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa', 'garcom', 'cozinha');$a$),
      ('fn_marcar_itens_pronto(uuid, uuid)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'cozinha');$a$),
      ('fn_finalizar_venda_pdv(uuid)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa', 'garcom');$a$),
      ('fn_registrar_pagamento_pedido(uuid, uuid, text, numeric, numeric, text)',
       $a$perform public.fn_assert_papel_pedido(p_pedido_id, 'caixa');$a$),
      ('fn_abrir_caixa(uuid, numeric, text)',
       $a$perform public.fn_assert_papel(p_empresa_id, 'caixa');$a$),
      ('fn_fechar_caixa(uuid, numeric, text)',
       $a$perform public.fn_assert_papel((select empresa_id from public.caixas where id = p_caixa_id), 'caixa');$a$),
      ('fn_registrar_movimentacao_caixa(uuid, text, numeric, text, text, uuid, text)',
       $a$perform public.fn_assert_papel((select empresa_id from public.caixas where id = p_caixa_id), 'caixa');$a$),
      ('fn_abrir_comanda(uuid, integer)',
       $a$perform public.fn_assert_papel((select empresa_id from public.mesas where id = p_mesa_id), 'garcom');$a$),
      ('fn_fechar_comanda(uuid)',
       $a$perform public.fn_assert_papel((select empresa_id from public.comandas where id = p_comanda_id), 'garcom');$a$),
      ('fn_transferir_comanda_mesa(uuid, uuid)',
       $a$perform public.fn_assert_papel((select empresa_id from public.comandas where id = p_comanda_id), 'garcom');$a$),
      ('fn_unir_comandas(uuid, uuid)',
       $a$perform public.fn_assert_papel((select empresa_id from public.comandas where id = p_comanda_origem_id), 'garcom');$a$),
      ('fn_concluir_producao(uuid)',
       $a$perform public.fn_assert_papel((select empresa_id from public.producoes_planejadas where id = p_producao_id), 'cozinha');$a$)
    ) as t(sig, assert_sql)
  loop
    begin
      v_def := pg_get_functiondef(r.sig::regprocedure);
    exception when undefined_function then
      raise notice 'RPC % ausente — pulando patch', r.sig;
      continue;
    end;

    v_new := regexp_replace(v_def, 'security\s+invoker', 'security definer', 'gi');
    if v_new !~* 'security\s+definer' then
      v_new := regexp_replace(
        v_new,
        '(language\s+plpgsql\s*)',
        E'\\1security definer\n',
        'i'
      );
    end if;

    if position('fn_assert_papel' in v_new) = 0 then
      if v_new ~* 'as\s+\$\$\s*declare' then
        v_new := regexp_replace(
          v_new,
          '(as\s+\$\$\s*declare[\s\S]*?\bbegin\b)',
          E'\\1\n  ' || r.assert_sql,
          'i'
        );
      else
        v_new := regexp_replace(
          v_new,
          '(as\s+\$\$\s*begin\b)',
          E'\\1\n  ' || r.assert_sql,
          'i'
        );
      end if;
    end if;

    execute v_new;
    raise notice 'Patched %', r.sig;
  end loop;

  begin
    v_def := pg_get_functiondef(
      'salvar_ficha_tecnica(uuid, uuid, text, text, integer, numeric, uuid, numeric, numeric, jsonb, text)'::regprocedure
    );
    v_new := regexp_replace(
      v_def,
      'if\s+not\s+exists\s*\(\s*select\s+1\s+from\s+public\.empresas\s+where\s+id\s*=\s*p_empresa_id\s+and\s+usuario_id\s*=\s*auth\.uid\(\)\s*\)\s*then\s*raise\s+exception[^;]+;',
      'perform public.fn_assert_papel(p_empresa_id);',
      'i'
    );
    if v_new is distinct from v_def then
      execute v_new;
      raise notice 'Patched salvar_ficha_tecnica auth check';
    elsif position('fn_assert_papel' in v_def) > 0 then
      raise notice 'salvar_ficha_tecnica já com assert';
    else
      raise warning 'Não foi possível patchar auth de salvar_ficha_tecnica';
    end if;
  exception when undefined_function then
    raise notice 'salvar_ficha_tecnica ausente';
  end;
end;
$patch$;

-- ---------------------------------------------------------------------------
-- 3) Policies RESTRICTIVE só na escrita (SELECT segue tenant)
-- ---------------------------------------------------------------------------
create or replace function public._rbac_drop_policy_if_exists(
  p_table regclass,
  p_policy text
)
returns void
language plpgsql
as $$
begin
  execute format('drop policy if exists %I on %s', p_policy, p_table);
end;
$$;

do $$
declare
  t text;
  gestao text[] := array['ingredientes', 'categorias_ingredientes', 'unidades_medida', 'fichas_tecnicas', 'estoque_lotes', 'estoque_movimentacoes', 'estoque_saldos', 'estoque_inventarios', 'estoque_inventario_itens', 'fornecedores', 'fornecedor_ingredientes', 'solicitacoes_compra', 'solicitacoes_compra_itens', 'pedidos_compra', 'pedidos_compra_itens', 'custos_fixos', 'custos_variaveis', 'metas_vendas', 'canais_venda', 'funcionarios', 'listas_compra', 'listas_compra_itens', 'integracoes_canais', 'integracoes_logs_sincronizacao', 'agentes_impressao', 'etiquetas_impressas', 'fila_impressao', 'pracas_producao', 'ingredientes_historico_precos'];
  sala text[] := array['pedidos', 'pedido_itens', 'pedido_item_adicionais', 'clientes', 'expedicoes', 'entregadores'];
  caixa_t text[] := array['caixas', 'caixa_movimentacoes', 'pagamentos', 'vendas'];
  garcom_t text[] := array['mesas', 'comandas'];

begin

  foreach t in array gestao loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabela % ausente — pulando', t;
      continue;
    end if;
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_gestao_ins_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_gestao_upd_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_gestao_del_' || t);
    execute format(
      $p$create policy %I on public.%I as restrictive for insert to authenticated with check (public.fn_papel_em(empresa_id))$p$,
      'rbac_gestao_ins_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for update to authenticated using (public.fn_papel_em(empresa_id)) with check (public.fn_papel_em(empresa_id))$p$,
      'rbac_gestao_upd_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for delete to authenticated using (public.fn_papel_em(empresa_id))$p$,
      'rbac_gestao_del_' || t, t
    );
  end loop;

  foreach t in array sala loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabela % ausente — pulando', t;
      continue;
    end if;
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_sala_ins_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_sala_upd_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_sala_del_' || t);
    execute format(
      $p$create policy %I on public.%I as restrictive for insert to authenticated with check (public.fn_papel_em(empresa_id, 'caixa', 'garcom'))$p$,
      'rbac_sala_ins_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for update to authenticated using (public.fn_papel_em(empresa_id, 'caixa', 'garcom')) with check (public.fn_papel_em(empresa_id, 'caixa', 'garcom'))$p$,
      'rbac_sala_upd_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for delete to authenticated using (public.fn_papel_em(empresa_id, 'caixa', 'garcom'))$p$,
      'rbac_sala_del_' || t, t
    );
  end loop;

  foreach t in array caixa_t loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabela % ausente — pulando', t;
      continue;
    end if;
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_caixa_ins_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_caixa_upd_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_caixa_del_' || t);
    execute format(
      $p$create policy %I on public.%I as restrictive for insert to authenticated with check (public.fn_papel_em(empresa_id, 'caixa'))$p$,
      'rbac_caixa_ins_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for update to authenticated using (public.fn_papel_em(empresa_id, 'caixa')) with check (public.fn_papel_em(empresa_id, 'caixa'))$p$,
      'rbac_caixa_upd_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for delete to authenticated using (public.fn_papel_em(empresa_id, 'caixa'))$p$,
      'rbac_caixa_del_' || t, t
    );
  end loop;

  foreach t in array garcom_t loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabela % ausente — pulando', t;
      continue;
    end if;
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_garcom_ins_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_garcom_upd_' || t);
    perform public._rbac_drop_policy_if_exists(('public.' || t)::regclass, 'rbac_garcom_del_' || t);
    execute format(
      $p$create policy %I on public.%I as restrictive for insert to authenticated with check (public.fn_papel_em(empresa_id, 'garcom'))$p$,
      'rbac_garcom_ins_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for update to authenticated using (public.fn_papel_em(empresa_id, 'garcom')) with check (public.fn_papel_em(empresa_id, 'garcom'))$p$,
      'rbac_garcom_upd_' || t, t
    );
    execute format(
      $p$create policy %I on public.%I as restrictive for delete to authenticated using (public.fn_papel_em(empresa_id, 'garcom'))$p$,
      'rbac_garcom_del_' || t, t
    );
  end loop;


  if to_regclass('public.producoes_planejadas') is not null then
    perform public._rbac_drop_policy_if_exists('public.producoes_planejadas'::regclass, 'rbac_cozinha_ins_producoes_planejadas');
    perform public._rbac_drop_policy_if_exists('public.producoes_planejadas'::regclass, 'rbac_cozinha_upd_producoes_planejadas');
    perform public._rbac_drop_policy_if_exists('public.producoes_planejadas'::regclass, 'rbac_cozinha_del_producoes_planejadas');
    create policy rbac_cozinha_ins_producoes_planejadas on public.producoes_planejadas
      as restrictive for insert to authenticated
      with check (public.fn_papel_em(empresa_id, 'cozinha'));
    create policy rbac_cozinha_upd_producoes_planejadas on public.producoes_planejadas
      as restrictive for update to authenticated
      using (public.fn_papel_em(empresa_id, 'cozinha'))
      with check (public.fn_papel_em(empresa_id, 'cozinha'));
    create policy rbac_cozinha_del_producoes_planejadas on public.producoes_planejadas
      as restrictive for delete to authenticated
      using (public.fn_papel_em(empresa_id, 'cozinha'));
  end if;

  if to_regclass('public.pedido_status_historico') is not null then
    perform public._rbac_drop_policy_if_exists('public.pedido_status_historico'::regclass, 'rbac_hist_ins_pedido_status_historico');
    perform public._rbac_drop_policy_if_exists('public.pedido_status_historico'::regclass, 'rbac_hist_upd_pedido_status_historico');
    perform public._rbac_drop_policy_if_exists('public.pedido_status_historico'::regclass, 'rbac_hist_del_pedido_status_historico');
    create policy rbac_hist_ins_pedido_status_historico on public.pedido_status_historico
      as restrictive for insert to authenticated
      with check (public.fn_papel_em(empresa_id, 'caixa', 'garcom', 'cozinha'));
    create policy rbac_hist_upd_pedido_status_historico on public.pedido_status_historico
      as restrictive for update to authenticated
      using (public.fn_papel_em(empresa_id, 'caixa', 'garcom', 'cozinha'))
      with check (public.fn_papel_em(empresa_id, 'caixa', 'garcom', 'cozinha'));
    create policy rbac_hist_del_pedido_status_historico on public.pedido_status_historico
      as restrictive for delete to authenticated
      using (public.fn_papel_em(empresa_id, 'caixa', 'garcom', 'cozinha'));
  end if;
end;
$$;

drop function if exists public._rbac_drop_policy_if_exists(regclass, text);
