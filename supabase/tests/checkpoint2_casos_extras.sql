-- Casos extras exigidos pela Sprint 05: cancelamento com estorno, falta de
-- estoque, múltiplos pagamentos/divisão de conta. Mesmo formato assertivo
-- do checkpoint2_pedidos_operacional.sql — precisa rodar com
-- request.jwt.claim.sub setado para o usuário dono da empresa de teste
-- (auth.uid() é checado por várias funções SECURITY DEFINER do projeto).

do $$
declare
  v_empresa_id uuid;
  v_ficha_id uuid;
  v_ingrediente_id uuid;
  v_saldo_antes numeric;
  v_saldo_depois_preparo numeric;
  v_saldo_depois_cancelamento numeric;
  v_pedido_id uuid;
  v_bloquear_original boolean;
  v_status text;
  v_count integer;
  v_total numeric;
begin
  select id into v_empresa_id from empresas where usuario_id = auth.uid() limit 1;
  select id into v_ficha_id from fichas_tecnicas where empresa_id = v_empresa_id and ativo limit 1;
  select ingrediente_id into v_ingrediente_id from fichas_tecnicas_itens where ficha_tecnica_id = v_ficha_id limit 1;

  if v_empresa_id is null or v_ficha_id is null or v_ingrediente_id is null then
    raise exception 'Pré-condição: precisa de empresa+ficha+ao menos 1 ingrediente na ficha';
  end if;

  ----------------------------------------------------------------------
  -- 1. Cancelamento com estorno de estoque
  ----------------------------------------------------------------------
  select coalesce(quantidade_total, 0) into v_saldo_antes from estoque_saldos
  where empresa_id = v_empresa_id and ingrediente_id = v_ingrediente_id;

  insert into pedidos (empresa_id, tipo) values (v_empresa_id, 'balcao') returning id into v_pedido_id;
  insert into pedido_itens (empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado)
  values (v_empresa_id, v_pedido_id, v_ficha_id, 1, 10.00);

  perform fn_confirmar_pedido(v_pedido_id);
  perform fn_iniciar_preparo_pedido(v_pedido_id);

  select coalesce(quantidade_total, 0) into v_saldo_depois_preparo from estoque_saldos
  where empresa_id = v_empresa_id and ingrediente_id = v_ingrediente_id;

  if v_saldo_depois_preparo >= v_saldo_antes then
    raise exception 'Falha: estoque deveria ter sido consumido ao iniciar preparo (antes=% depois=%)', v_saldo_antes, v_saldo_depois_preparo;
  end if;

  perform fn_cancelar_pedido(v_pedido_id, 'Cliente desistiu (teste automatizado)');

  select coalesce(quantidade_total, 0) into v_saldo_depois_cancelamento from estoque_saldos
  where empresa_id = v_empresa_id and ingrediente_id = v_ingrediente_id;

  if abs(v_saldo_depois_cancelamento - v_saldo_antes) > 0.0001 then
    raise exception 'Falha: estoque deveria ter sido estornado ao cancelar (antes=% depois_cancelamento=%)', v_saldo_antes, v_saldo_depois_cancelamento;
  end if;

  select status into v_status from pedidos where id = v_pedido_id;
  if v_status <> 'cancelado' then
    raise exception 'Falha: pedido deveria estar cancelado, está %', v_status;
  end if;

  delete from pedidos where id = v_pedido_id;

  ----------------------------------------------------------------------
  -- 2. Falta de estoque bloqueia confirmação quando a empresa exige
  ----------------------------------------------------------------------
  select bloquear_venda_sem_estoque into v_bloquear_original from empresas where id = v_empresa_id;
  update empresas set bloquear_venda_sem_estoque = true where id = v_empresa_id;

  insert into pedidos (empresa_id, tipo) values (v_empresa_id, 'balcao') returning id into v_pedido_id;
  insert into pedido_itens (empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado)
  values (v_empresa_id, v_pedido_id, v_ficha_id, 99999, 10.00);

  begin
    perform fn_confirmar_pedido(v_pedido_id);
    raise exception 'Falha: deveria ter bloqueado confirmação por falta de estoque';
  exception when others then
    if sqlerrm not like '%Estoque insuficiente%' then raise; end if;
  end;

  update empresas set bloquear_venda_sem_estoque = v_bloquear_original where id = v_empresa_id;
  delete from pedidos where id = v_pedido_id;

  ----------------------------------------------------------------------
  -- 3. Múltiplos pagamentos / divisão de conta
  ----------------------------------------------------------------------
  insert into pedidos (empresa_id, tipo, taxa_entrega) values (v_empresa_id, 'balcao', 0) returning id into v_pedido_id;
  insert into pedido_itens (empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado)
  values (v_empresa_id, v_pedido_id, v_ficha_id, 2, 10.00);

  select total into v_total from pedidos where id = v_pedido_id;
  if v_total <> 20.00 then
    raise exception 'Falha: total esperado 20.00, calculado %', v_total;
  end if;

  perform fn_registrar_pagamento_pedido(v_pedido_id, 'dinheiro', 12.00);
  perform fn_registrar_pagamento_pedido(v_pedido_id, 'pix', 8.00);

  select count(*) into v_count from pagamentos where pedido_id = v_pedido_id;
  if v_count <> 2 then
    raise exception 'Falha: esperava 2 pagamentos (conta dividida), achei %', v_count;
  end if;

  select sum(valor) into v_total from pagamentos where pedido_id = v_pedido_id;
  if v_total <> 20.00 then
    raise exception 'Falha: soma dos pagamentos deveria ser 20.00, é %', v_total;
  end if;

  delete from pagamentos where pedido_id = v_pedido_id;
  delete from pedidos where id = v_pedido_id;

  raise notice 'OK: casos extras passaram';
end;
$$;

select 'OK: casos extras passaram' as resultado;
