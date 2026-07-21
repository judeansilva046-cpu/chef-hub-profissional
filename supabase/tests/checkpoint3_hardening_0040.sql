-- Checkpoint 3: hardening 0040–0042 (máquina de estados, itens pós-rascunho,
-- pagamento com teto, funcionários).
--
-- Pré-condições (mesma sessão):
--   select set_config('request.jwt.claim.sub', '<uuid do usuário dono>', false);
-- Migrations até 0042 aplicadas. Retorna 'OK: checkpoint 3 passou'.

do $$
declare
  v_empresa_id uuid;
  v_ficha_id uuid;
  v_pedido_id uuid;
  v_item_id uuid;
  v_status text;
  v_funcionario_id uuid;
  v_pago numeric;
begin
  select id into v_empresa_id from empresas limit 1;
  select id into v_ficha_id
  from fichas_tecnicas
  where empresa_id = v_empresa_id and ativo
  limit 1;

  if v_empresa_id is null or v_ficha_id is null then
    raise exception 'Pré-condição: empresa + ficha técnica ativa';
  end if;

  ----------------------------------------------------------------------
  -- 1) Itens só em rascunho
  ----------------------------------------------------------------------
  insert into pedidos (empresa_id, tipo)
  values (v_empresa_id, 'balcao')
  returning id into v_pedido_id;

  insert into pedido_itens (
    empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado
  ) values (v_empresa_id, v_pedido_id, v_ficha_id, 1, 20)
  returning id into v_item_id;

  perform fn_confirmar_pedido(v_pedido_id);

  begin
    insert into pedido_itens (
      empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado
    ) values (v_empresa_id, v_pedido_id, v_ficha_id, 1, 20);
    raise exception 'Falha: deveria bloquear item após confirmar';
  exception when others then
    if sqlerrm not like '%rascunho%' then raise; end if;
  end;

  begin
    update pedido_itens set quantidade = 2 where id = v_item_id;
    raise exception 'Falha: deveria bloquear update de quantidade após confirmar';
  exception when others then
    if sqlerrm not like '%rascunho%' then raise; end if;
  end;

  ----------------------------------------------------------------------
  -- 2) Transição de status ilegal (sem RPC)
  ----------------------------------------------------------------------
  begin
    update pedidos set status = 'entregue' where id = v_pedido_id;
    raise exception 'Falha: deveria bloquear salto confirmado → entregue';
  exception when others then
    if sqlerrm not like '%não permitida%' and sqlerrm not like '%Transição%' then
      raise;
    end if;
  end;

  ----------------------------------------------------------------------
  -- 3) Pagamento não pode exceder total
  ----------------------------------------------------------------------
  -- pedido ainda confirmado; total deve ser 20
  begin
    perform fn_registrar_pagamento_pedido(v_pedido_id, null, 'pix', 50, null, null);
    raise exception 'Falha: deveria bloquear overpay';
  exception when others then
    if sqlerrm not like '%excede%' and sqlerrm not like '%Pagamento%' then
      raise;
    end if;
  end;

  perform fn_registrar_pagamento_pedido(v_pedido_id, null, 'pix', 20, null, null);
  select coalesce(sum(valor), 0) into v_pago from pagamentos where pedido_id = v_pedido_id;
  if v_pago <> 20 then
    raise exception 'Falha: pagamento esperado 20, veio %', v_pago;
  end if;

  ----------------------------------------------------------------------
  -- 4) Ciclo KDS: preparo → itens prontos → pedido pronto → concluir
  ----------------------------------------------------------------------
  perform fn_iniciar_preparo_pedido(v_pedido_id);
  select status into v_status from pedidos where id = v_pedido_id;
  if v_status <> 'em_preparo' then
    raise exception 'Falha: status após preparo deveria ser em_preparo, é %', v_status;
  end if;

  perform fn_marcar_itens_pronto(v_pedido_id, null);
  select status into v_status from pedidos where id = v_pedido_id;
  if v_status <> 'pronto' then
    raise exception 'Falha: status após itens prontos deveria ser pronto, é %', v_status;
  end if;

  perform set_config('app.pedido_concluir_via_expedicao', 'on', true);
  perform fn_concluir_pedido(v_pedido_id);
  select status into v_status from pedidos where id = v_pedido_id;
  if v_status <> 'entregue' then
    raise exception 'Falha: status final deveria ser entregue, é %', v_status;
  end if;

  ----------------------------------------------------------------------
  -- 5) Funcionários (0042)
  ----------------------------------------------------------------------
  insert into funcionarios (
    empresa_id, nome, salario_bruto, carga_horaria_semanal, beneficios_mensais, percentual_encargos
  ) values (v_empresa_id, 'Checkpoint 3 Func', 2000, 44, 200, 36.8)
  returning id into v_funcionario_id;

  if v_funcionario_id is null then
    raise exception 'Falha: insert em funcionarios';
  end if;

  delete from funcionarios where id = v_funcionario_id;

  -- limpa pedido de teste (vendas/pagamentos ficam; ok para checkpoint)
  raise notice 'OK: checkpoint 3 passou';
end $$;
