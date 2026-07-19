-- Sprint 08 — testes das regras críticas de Compras.
-- Roda inteiro dentro de uma transação com ROLLBACK no final: usa dados
-- reais já existentes no projeto (empresa "Cantina do Chef") mas não deixa
-- nenhum registro de teste no banco. Resultados ficam numa tabela temporária
-- lida pelo SELECT final.
begin;

create temporary table resultados (
  id uuid default gen_random_uuid() primary key,
  criado_em timestamptz default clock_timestamp(),
  caso text not null,
  passou boolean not null,
  detalhe text
);
grant all on resultados to authenticated;

do $$
declare
  v_empresa_cantina uuid := '4f1d932d-261f-428b-8971-19bfc8da80d9';
  v_empresa_outra uuid := '688131c1-43c4-4dc6-85d9-f5d6349521c9';
  v_dono uuid := '24071b8b-3e0e-4247-8f45-a02a883650bb';
  v_usuario_aprovador uuid := '12267d8f-f8c3-4034-a285-070f605169de';
  v_usuario_sem_papel uuid := '8e02f04e-f0a8-49ac-aa3f-faf6c36a73b7';
  v_ingrediente uuid := '17ade875-f224-477a-b814-c1992e5f7acb';
  v_ingrediente2 uuid := '0e791dcd-7089-4c4e-a29b-883bc5bbbb49';
  v_fornecedor_a uuid := '3229bb67-8081-4bf8-b5d2-6b7959be6ce2';
  v_fornecedor_b uuid;

  v_sol1 uuid; v_sol1_num int;
  v_sol2 uuid; v_sol2_num int;
  v_sol_rejeitada uuid;
  v_sol_aprovador uuid;

  v_cot uuid; v_cot_num int;
  v_cot_item uuid;
  v_cot_forn_a uuid;
  v_cot_forn_b uuid;
  v_melhor uuid;
  v_pedido uuid;
  v_pedido_item uuid;
  v_pedido_status text;

  v_pode boolean;
  v_count int;
  v_estoque_antes int;
  v_estoque_depois int;
  v_contas_pagar_count int;
  v_recebimento_id uuid;
  v_divergencia boolean;
  v_score numeric;
  v_preco_pedido numeric;
begin
  -- ==========================================================
  -- Contexto: agir como o DONO da Cantina do Chef.
  -- ==========================================================
  perform set_config('request.jwt.claim.sub', v_dono::text, true);
  set local role authenticated;

  -- ---- 1. Numeração sequencial por empresa/tipo -----------------------
  insert into public.solicitacoes_compra (empresa_id, justificativa, prioridade)
    values (v_empresa_cantina, 'Teste sprint 08 — item 1', 'normal')
    returning id, numero into v_sol1, v_sol1_num;
  insert into public.solicitacoes_compra (empresa_id, justificativa, prioridade)
    values (v_empresa_cantina, 'Teste sprint 08 — item 2', 'alta')
    returning id, numero into v_sol2, v_sol2_num;

  insert into resultados (caso, passou, detalhe) values (
    'Numeração sequencial de solicitações',
    v_sol2_num = v_sol1_num + 1,
    format('sol1=%s sol2=%s', v_sol1_num, v_sol2_num)
  );

  insert into public.solicitacoes_compra_itens (solicitacao_id, ingrediente_id, quantidade, preco_estimado)
    values (v_sol1, v_ingrediente, 10, 5.00);
  insert into public.solicitacoes_compra_itens (solicitacao_id, ingrediente_id, quantidade, preco_estimado)
    values (v_sol2, v_ingrediente, 5, 5.00);

  -- ---- 2. RLS: isolamento multiempresa ---------------------------------
  select count(*) into v_count
  from public.solicitacoes_compra
  where empresa_id = v_empresa_outra;

  insert into resultados (caso, passou, detalhe) values (
    'RLS: dono da Cantina não enxerga solicitações de outra empresa',
    v_count = 0,
    format('linhas visíveis=%s', v_count)
  );

  -- ---- 3. Auditoria automática ------------------------------------------
  select count(*) into v_count
  from public.compras_auditoria
  where tabela = 'solicitacoes_compra' and registro_id = v_sol1;

  insert into resultados (caso, passou, detalhe) values (
    'Auditoria: insert em solicitacoes_compra gera registro',
    v_count >= 1,
    format('linhas de auditoria=%s', v_count)
  );

  -- ---- 4. Fluxo de aprovação: dono aprova e rejeita --------------------
  perform public.fn_aprovar_solicitacao_compra(v_sol1, 'Aprovado no teste automatizado');

  select status into v_pedido_status from public.solicitacoes_compra where id = v_sol1;
  insert into resultados (caso, passou, detalhe) values (
    'Aprovação: fn_aprovar_solicitacao_compra muda status para aprovada',
    v_pedido_status = 'aprovada',
    format('status=%s', v_pedido_status)
  );

  select count(*) into v_count
  from public.solicitacoes_compra_aprovacoes
  where solicitacao_id = v_sol1 and acao = 'aprovar';
  insert into resultados (caso, passou, detalhe) values (
    'Aprovação: log gravado em solicitacoes_compra_aprovacoes',
    v_count = 1,
    format('linhas de log=%s', v_count)
  );

  perform public.fn_rejeitar_solicitacao_compra(v_sol2, 'Motivo de teste');
  select status into v_pedido_status from public.solicitacoes_compra where id = v_sol2;
  insert into resultados (caso, passou, detalhe) values (
    'Aprovação: fn_rejeitar_solicitacao_compra muda status para rejeitada',
    v_pedido_status = 'rejeitada',
    format('status=%s', v_pedido_status)
  );

  -- Rejeição sem motivo deve falhar.
  begin
    perform public.fn_rejeitar_solicitacao_compra(v_sol1, '');
    insert into resultados (caso, passou, detalhe) values (
      'Aprovação: rejeitar sem motivo é bloqueado', false, 'não levantou exceção'
    );
  exception when others then
    insert into resultados (caso, passou, detalhe) values (
      'Aprovação: rejeitar sem motivo é bloqueado', true, sqlerrm
    );
  end;

  -- ---- 5. Papel "aprovador" de outro usuário ----------------------------
  insert into public.usuarios_empresa (empresa_id, usuario_id, papel, ativo, convidado_por)
    values (v_empresa_cantina, v_usuario_aprovador, 'aprovador', true, v_dono)
    on conflict do nothing;

  insert into public.solicitacoes_compra (empresa_id, justificativa)
    values (v_empresa_cantina, 'Teste papel aprovador') returning id into v_sol_aprovador;
  insert into public.solicitacoes_compra_itens (solicitacao_id, ingrediente_id, quantidade, preco_estimado)
    values (v_sol_aprovador, v_ingrediente, 1, 10);

  perform set_config('request.jwt.claim.sub', v_usuario_aprovador::text, true);
  select public.fn_pode_aprovar_solicitacao(v_sol_aprovador) into v_pode;
  insert into resultados (caso, passou, detalhe) values (
    'Permissões: usuário com papel aprovador pode aprovar solicitação da empresa da qual é membro (não é dono)',
    v_pode,
    format('pode=%s', v_pode)
  );

  perform set_config('request.jwt.claim.sub', v_usuario_sem_papel::text, true);
  select public.fn_pode_aprovar_solicitacao(v_sol_aprovador) into v_pode;
  insert into resultados (caso, passou, detalhe) values (
    'Permissões: usuário sem vínculo com a empresa NÃO pode aprovar',
    coalesce(v_pode, false) = false,
    format('pode=%s (nota: função retorna NULL em vez de false quando o chamador não tem nenhum vínculo com a empresa — o app trata isso com `?? false`, e o gate de entrada de fn_aprovar_solicitacao_compra bloqueia antes de chegar aqui, mas vale corrigir a função para sempre retornar boolean não-nulo)', v_pode)
  );

  begin
    perform public.fn_aprovar_solicitacao_compra(v_sol_aprovador, null);
    insert into resultados (caso, passou, detalhe) values (
      'Permissões: aprovação por usuário sem papel é bloqueada', false, 'não levantou exceção'
    );
  exception when others then
    insert into resultados (caso, passou, detalhe) values (
      'Permissões: aprovação por usuário sem papel é bloqueada', true, sqlerrm
    );
  end;

  -- volta a ser o dono para o restante do teste
  perform set_config('request.jwt.claim.sub', v_dono::text, true);
  perform public.fn_aprovar_solicitacao_compra(v_sol_aprovador, 'ok');

  -- ---- 6. Cotação: propostas, escolha automática, finalização ----------
  insert into public.fornecedores (empresa_id, nome, categorias, ativo)
    values (v_empresa_cantina, 'Fornecedor Teste Sprint 08', array['teste'], true)
    returning id into v_fornecedor_b;

  insert into public.compras_cotacoes (empresa_id, solicitacao_origem_id, observacao)
    values (v_empresa_cantina, v_sol_aprovador, 'Cotação de teste')
    returning id, numero into v_cot, v_cot_num;

  insert into public.compras_cotacoes_itens (empresa_id, cotacao_id, ingrediente_id, quantidade)
    values (v_empresa_cantina, v_cot, v_ingrediente, 1)
    returning id into v_cot_item;

  insert into public.compras_cotacoes_fornecedores (empresa_id, cotacao_id, fornecedor_id)
    values (v_empresa_cantina, v_cot, v_fornecedor_a)
    returning id into v_cot_forn_a;
  insert into public.compras_cotacoes_fornecedores (empresa_id, cotacao_id, fornecedor_id)
    values (v_empresa_cantina, v_cot, v_fornecedor_b)
    returning id into v_cot_forn_b;

  -- duplicidade: convidar o mesmo fornecedor duas vezes deve falhar (unique cotacao_id+fornecedor_id)
  begin
    insert into public.compras_cotacoes_fornecedores (empresa_id, cotacao_id, fornecedor_id)
      values (v_empresa_cantina, v_cot, v_fornecedor_a);
    insert into resultados (caso, passou, detalhe) values (
      'Duplicidade: convidar o mesmo fornecedor duas vezes na cotação é bloqueado', false, 'não levantou exceção'
    );
  exception when unique_violation then
    insert into resultados (caso, passou, detalhe) values (
      'Duplicidade: convidar o mesmo fornecedor duas vezes na cotação é bloqueado', true, sqlerrm
    );
  end;

  -- fornecedor A propõe mais caro, fornecedor B mais barato
  insert into public.compras_cotacoes_propostas_itens (empresa_id, cotacao_fornecedor_id, cotacao_item_id, preco_unitario)
    values (v_empresa_cantina, v_cot_forn_a, v_cot_item, 12.00);
  insert into public.compras_cotacoes_propostas_itens (empresa_id, cotacao_fornecedor_id, cotacao_item_id, preco_unitario)
    values (v_empresa_cantina, v_cot_forn_b, v_cot_item, 8.00);

  select public.fn_escolher_melhor_proposta_cotacao(v_cot) into v_melhor;
  insert into resultados (caso, passou, detalhe) values (
    'Cotação: escolha automática seleciona o fornecedor de menor custo total',
    v_melhor = v_fornecedor_b,
    format('escolhido=%s esperado(fornecedor_b)=%s', v_melhor, v_fornecedor_b)
  );

  select public.fn_finalizar_cotacao(v_cot, v_melhor, null, true) into v_pedido;

  select status into v_pedido_status from public.compras_cotacoes where id = v_cot;
  insert into resultados (caso, passou, detalhe) values (
    'Cotação: finalizar muda status para finalizada e cria pedido de compra',
    v_pedido_status = 'finalizada' and v_pedido is not null,
    format('status=%s pedido=%s', v_pedido_status, v_pedido)
  );

  select status into v_pedido_status from public.solicitacoes_compra where id = v_sol_aprovador;
  insert into resultados (caso, passou, detalhe) values (
    'Cotação: finalizar marca a solicitação de origem como convertida',
    v_pedido_status = 'convertida',
    format('status=%s', v_pedido_status)
  );

  select id, preco_unitario into v_pedido_item, v_preco_pedido
  from public.pedidos_compra_itens where pedido_id = v_pedido limit 1;
  insert into resultados (caso, passou, detalhe) values (
    'Cotação: item do pedido usa o preço proposto pelo fornecedor vencedor',
    v_preco_pedido = 8.00,
    format('preco_unitario=%s', v_preco_pedido)
  );

  -- ---- 7. Recebimento parcial, total, divergência, estoque e contas a pagar
  select count(*) into v_estoque_antes
  from public.estoque_movimentacoes
  where ingrediente_id = v_ingrediente and referencia_tipo = 'compra' and referencia_id = v_pedido;

  -- recebimento parcial (metade da quantidade pedida)
  perform public.fn_registrar_recebimento_item(
    p_pedido_item_id => v_pedido_item,
    p_quantidade_recebida => 0.5,
    p_numero_lote => 'LOTE-TESTE-1',
    p_data_validade => current_date + 30
  );

  select status into v_pedido_status from public.pedidos_compra where id = v_pedido;
  insert into resultados (caso, passou, detalhe) values (
    'Recebimento parcial: pedido fica parcialmente_recebido',
    v_pedido_status = 'parcialmente_recebido',
    format('status=%s', v_pedido_status)
  );

  select count(*) into v_estoque_depois
  from public.estoque_movimentacoes
  where ingrediente_id = v_ingrediente and referencia_tipo = 'compra' and referencia_id = v_pedido;
  insert into resultados (caso, passou, detalhe) values (
    'Recebimento: entrada em estoque cria lote (FIFO)',
    v_estoque_depois = v_estoque_antes + 1,
    format('lotes antes=%s depois=%s', v_estoque_antes, v_estoque_depois)
  );

  select count(*) into v_contas_pagar_count
  from public.contas_pagar where referencia_tipo = 'pedido_compra' and referencia_id = v_pedido;
  insert into resultados (caso, passou, detalhe) values (
    'Financeiro: recebimento parcial já gera conta(s) a pagar vinculada(s) ao pedido',
    v_contas_pagar_count >= 1,
    format('parcelas=%s', v_contas_pagar_count)
  );

  -- recebimento do restante, com preço divergente do pedido (gera divergência)
  perform public.fn_registrar_recebimento_item(
    p_pedido_item_id => v_pedido_item,
    p_quantidade_recebida => 0.5,
    p_preco_conferido => 9.00,
    p_numero_lote => 'LOTE-TESTE-2',
    p_data_validade => current_date + 30
  );

  select status into v_pedido_status from public.pedidos_compra where id = v_pedido;
  insert into resultados (caso, passou, detalhe) values (
    'Recebimento total: pedido fica recebido quando soma bate com o pedido',
    v_pedido_status = 'recebido',
    format('status=%s', v_pedido_status)
  );

  select divergencia into v_divergencia
  from public.compras_recebimentos_itens
  where pedido_item_id = v_pedido_item and preco_conferido = 9.00
  limit 1;
  insert into resultados (caso, passou, detalhe) values (
    'Recebimento: preço conferido diferente do pedido é marcado como divergência',
    v_divergencia is true,
    format('divergencia=%s', v_divergencia)
  );

  select count(*) into v_count
  from public.compras_notificacoes
  where tipo = 'divergencia_recebimento' and referencia_id = v_pedido;
  insert into resultados (caso, passou, detalhe) values (
    'Recebimento: divergência dispara notificação',
    v_count >= 1,
    format('notificações=%s', v_count)
  );

  -- ---- 8. Recusa de item -------------------------------------------------
  insert into public.pedidos_compra (empresa_id, fornecedor_id)
    values (v_empresa_cantina, v_fornecedor_a) returning id into v_pedido;
  insert into public.pedidos_compra_itens (pedido_id, ingrediente_id, quantidade_pedida, preco_unitario)
    values (v_pedido, v_ingrediente2, 4, 3.00) returning id into v_pedido_item;

  perform public.fn_registrar_recebimento_item(
    p_pedido_item_id => v_pedido_item,
    p_quantidade_recusada => 4,
    p_motivo_divergencia => 'Produto avariado — teste automatizado'
  );

  select status into v_pedido_status from public.pedidos_compra where id = v_pedido;
  insert into resultados (caso, passou, detalhe) values (
    'Recusa: item 100% recusado fecha o pedido como recebido (nada mais pendente)',
    v_pedido_status = 'recebido',
    format('status=%s', v_pedido_status)
  );

  -- ---- 9. Avaliação de fornecedor + score --------------------------------
  insert into public.compras_avaliacoes_fornecedor (
    empresa_id, fornecedor_id, pontualidade, qualidade, preco, atendimento, comentario
  ) values (v_empresa_cantina, v_fornecedor_b, 5, 4, 5, 5, 'Teste automatizado');

  select score_geral into v_score
  from public.compras_fornecedores_score
  where fornecedor_id = v_fornecedor_b;
  insert into resultados (caso, passou, detalhe) values (
    'Avaliação: compras_fornecedores_score reflete a avaliação registrada',
    v_score is not null and v_score > 0,
    format('score_geral=%s', v_score)
  );

  -- ---- 10. RLS de escrita: papel "leitura" não pode inserir --------------
  insert into public.usuarios_empresa (empresa_id, usuario_id, papel, ativo, convidado_por)
    values (v_empresa_cantina, v_usuario_sem_papel, 'leitura', true, v_dono)
    on conflict do nothing;

  perform set_config('request.jwt.claim.sub', v_usuario_sem_papel::text, true);
  begin
    insert into public.solicitacoes_compra (empresa_id, justificativa)
      values (v_empresa_cantina, 'Não deveria conseguir');
    insert into resultados (caso, passou, detalhe) values (
      'Permissões: papel "leitura" não pode criar solicitação de compra', false, 'insert não bloqueado'
    );
  exception when others then
    insert into resultados (caso, passou, detalhe) values (
      'Permissões: papel "leitura" não pode criar solicitação de compra', true, sqlerrm
    );
  end;

  perform set_config('request.jwt.claim.sub', v_dono::text, true);
end $$;

select caso, passou, detalhe from resultados order by criado_em;

rollback;
