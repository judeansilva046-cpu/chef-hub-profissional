-- Teste de integração (SQL) do checkpoint 2 da Sprint 05: Mesas/Comandas,
-- Expedição, Impressão automática e a cascata de status que os liga.
-- Roda como um bloco só, assertivo (RAISE EXCEPTION na primeira falha) —
-- não é um substituto de E2E de UI, mas cobre a lógica de negócio real, que
-- neste projeto vive majoritariamente em funções/triggers do Postgres, não
-- no app. Idempotente: cria e limpa todos os próprios dados de teste.
--
-- Como rodar: antes do bloco, execute
--   select set_config('request.jwt.claim.sub', '<uuid do usuário dono da
--   empresa de teste>', false);
-- na MESMA sessão/chamada — várias funções SECURITY DEFINER do projeto
-- (ex: fn_recalcular_estoque_saldo, 0022) checam auth.uid() manualmente, que
-- só resolve com esse GUC setado (fora do contexto normal do PostgREST, que
-- o define automaticamente por request). Cole o conteúdo no SQL Editor do
-- Supabase (ou via mcp__claude_ai_Supabase__execute_sql) num projeto com as
-- migrations até 0039 aplicadas. Retorna 'OK: checkpoint 2 passou' se tudo
-- passar; lança exceção descritiva no primeiro problema encontrado.

do $$
declare
  v_empresa_id uuid;
  v_ficha_id uuid;
  v_praca_cozinha_id uuid;
  v_praca_original uuid;
  v_mesa_a_id uuid;
  v_mesa_b_id uuid;
  v_comanda_a_id uuid;
  v_comanda_b_id uuid;
  v_pedido_a_id uuid;
  v_pedido_b_id uuid;
  v_pedido_entrega_id uuid;
  v_status text;
  v_count integer;
  v_expedicao_id uuid;
  v_comanda_destino_check uuid;
begin
  select id into v_empresa_id from empresas limit 1;
  select id into v_ficha_id from fichas_tecnicas where empresa_id = v_empresa_id and ativo limit 1;
  select id into v_praca_cozinha_id from pracas_producao where nome = 'Cozinha' and empresa_id is null;

  if v_empresa_id is null or v_ficha_id is null then
    raise exception 'Pré-condição: precisa de ao menos 1 empresa com 1 ficha técnica ativa para rodar o teste';
  end if;

  -- Marca temporariamente a ficha com praça (restaura no final).
  select praca_producao_id into v_praca_original from fichas_tecnicas where id = v_ficha_id;
  update fichas_tecnicas set praca_producao_id = v_praca_cozinha_id where id = v_ficha_id;

  ----------------------------------------------------------------------
  -- 1. Mesas/Comandas: abrir, pedir, tentar fechar com pendência, concluir, fechar
  ----------------------------------------------------------------------
  insert into mesas (empresa_id, identificador, capacidade) values (v_empresa_id, 'TESTE-A', 4) returning id into v_mesa_a_id;
  insert into mesas (empresa_id, identificador, capacidade) values (v_empresa_id, 'TESTE-B', 2) returning id into v_mesa_b_id;

  v_comanda_a_id := fn_abrir_comanda(v_mesa_a_id, 2);

  select status into v_status from mesas where id = v_mesa_a_id;
  if v_status <> 'ocupada' then
    raise exception 'Falha: mesa deveria estar ocupada após abrir comanda, está %', v_status;
  end if;

  begin
    perform fn_abrir_comanda(v_mesa_a_id, 2);
    raise exception 'Falha: deveria ter bloqueado abrir 2a comanda na mesma mesa ocupada';
  exception when others then
    if sqlerrm not like '%já está ocupada%' then raise; end if;
  end;

  insert into pedidos (empresa_id, tipo, comanda_id) values (v_empresa_id, 'mesa', v_comanda_a_id) returning id into v_pedido_a_id;
  insert into pedido_itens (empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado)
  values (v_empresa_id, v_pedido_a_id, v_ficha_id, 1, 10.00);

  begin
    perform fn_fechar_comanda(v_comanda_a_id);
    raise exception 'Falha: deveria ter bloqueado fechar comanda com pedido em aberto';
  exception when others then
    if sqlerrm not like '%em aberto%' then raise; end if;
  end;

  perform fn_confirmar_pedido(v_pedido_a_id);
  perform fn_iniciar_preparo_pedido(v_pedido_a_id);
  update pedidos set status = 'pronto' where id = v_pedido_a_id;
  perform fn_concluir_pedido(v_pedido_a_id);

  perform fn_fechar_comanda(v_comanda_a_id);
  select status into v_status from mesas where id = v_mesa_a_id;
  if v_status <> 'livre' then
    raise exception 'Falha: mesa deveria voltar a livre após fechar comanda, está %', v_status;
  end if;

  ----------------------------------------------------------------------
  -- 2. Impressão automática: comprovante_pedido (confirmar) e comprovante_praca (em_preparo)
  ----------------------------------------------------------------------
  select count(*) into v_count from fila_impressao
  where referencia_tipo = 'pedido' and referencia_id = v_pedido_a_id and tipo = 'comprovante_pedido';
  if v_count <> 1 then
    raise exception 'Falha: esperava 1 comprovante_pedido enfileirado ao confirmar, achei %', v_count;
  end if;

  select count(*) into v_count from fila_impressao
  where referencia_tipo = 'pedido' and referencia_id = v_pedido_a_id and tipo = 'comprovante_praca';
  if v_count <> 1 then
    raise exception 'Falha: esperava 1 comprovante_praca (Cozinha) ao iniciar preparo, achei %', v_count;
  end if;

  ----------------------------------------------------------------------
  -- 3. Unir comandas: duas mesas com pedidos, unir migra pedidos e fecha origem
  ----------------------------------------------------------------------
  v_comanda_a_id := fn_abrir_comanda(v_mesa_a_id, 2);
  v_comanda_b_id := fn_abrir_comanda(v_mesa_b_id, 2);

  insert into pedidos (empresa_id, tipo, comanda_id) values (v_empresa_id, 'mesa', v_comanda_a_id) returning id into v_pedido_a_id;
  insert into pedidos (empresa_id, tipo, comanda_id) values (v_empresa_id, 'mesa', v_comanda_b_id) returning id into v_pedido_b_id;

  perform fn_unir_comandas(v_comanda_a_id, v_comanda_b_id);

  select comanda_id into v_comanda_destino_check from pedidos where id = v_pedido_a_id;
  if v_comanda_destino_check <> v_comanda_b_id then
    raise exception 'Falha: pedido da comanda de origem deveria ter migrado para a comanda destino';
  end if;

  select status into v_status from comandas where id = v_comanda_a_id;
  if v_status <> 'fechada' then
    raise exception 'Falha: comanda de origem deveria estar fechada após unir, está %', v_status;
  end if;

  select status into v_status from mesas where id = v_mesa_a_id;
  if v_status <> 'livre' then
    raise exception 'Falha: mesa de origem deveria estar livre após unir, está %', v_status;
  end if;

  -- limpa pedidos de teste da comanda B antes de fechar
  delete from pedidos where id in (v_pedido_a_id, v_pedido_b_id);
  perform fn_fechar_comanda(v_comanda_b_id);

  ----------------------------------------------------------------------
  -- 4. Expedição: pronto cria expedição + comprovante_expedicao; saiu/entregue sincronizam pedido
  ----------------------------------------------------------------------
  insert into pedidos (empresa_id, tipo) values (v_empresa_id, 'entrega') returning id into v_pedido_entrega_id;
  insert into pedido_itens (empresa_id, pedido_id, ficha_tecnica_id, quantidade, preco_unitario_praticado)
  values (v_empresa_id, v_pedido_entrega_id, v_ficha_id, 1, 10.00);

  perform fn_confirmar_pedido(v_pedido_entrega_id);
  perform fn_iniciar_preparo_pedido(v_pedido_entrega_id);
  update pedidos set status = 'pronto' where id = v_pedido_entrega_id;

  select id into v_expedicao_id from expedicoes where pedido_id = v_pedido_entrega_id;
  if v_expedicao_id is null then
    raise exception 'Falha: expedição deveria ter sido criada automaticamente ao pedido de entrega ficar pronto';
  end if;

  select count(*) into v_count from fila_impressao
  where referencia_tipo = 'pedido' and referencia_id = v_pedido_entrega_id and tipo = 'comprovante_expedicao';
  if v_count <> 1 then
    raise exception 'Falha: esperava 1 comprovante_expedicao, achei %', v_count;
  end if;

  update expedicoes set status = 'conferido' where id = v_expedicao_id;
  update expedicoes set status = 'embalado' where id = v_expedicao_id;
  update expedicoes set status = 'saiu' where id = v_expedicao_id;

  select status into v_status from pedidos where id = v_pedido_entrega_id;
  if v_status <> 'saiu_para_entrega' then
    raise exception 'Falha: pedido deveria sincronizar para saiu_para_entrega, está %', v_status;
  end if;

  update expedicoes set status = 'entregue' where id = v_expedicao_id;

  select status into v_status from pedidos where id = v_pedido_entrega_id;
  if v_status <> 'entregue' then
    raise exception 'Falha: pedido deveria sincronizar para entregue via fn_concluir_pedido, está %', v_status;
  end if;

  select count(*) into v_count from vendas where observacao = 'Pedido #' || (select numero from pedidos where id = v_pedido_entrega_id);
  if v_count < 1 then
    raise exception 'Falha: fn_concluir_pedido deveria ter criado ao menos 1 venda';
  end if;

  ----------------------------------------------------------------------
  -- limpeza
  ----------------------------------------------------------------------
  delete from vendas where observacao = 'Pedido #' || (select numero from pedidos where id = v_pedido_entrega_id);
  delete from pedidos where id in (v_pedido_entrega_id);
  delete from mesas where id in (v_mesa_a_id, v_mesa_b_id);
  update fichas_tecnicas set praca_producao_id = v_praca_original where id = v_ficha_id;

  raise notice 'OK: checkpoint 2 passou';
end;
$$;

select 'OK: checkpoint 2 passou' as resultado;
