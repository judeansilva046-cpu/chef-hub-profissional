-- Cleanup pré-Sprint 09 — testes das regras críticas.
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
  v_empresa uuid := '4f1d932d-261f-428b-8971-19bfc8da80d9';
  v_empresa_outra uuid := '688131c1-43c4-4dc6-85d9-f5d6349521c9';
  v_dono uuid := '24071b8b-3e0e-4247-8f45-a02a883650bb';
  v_usuario_sem_papel uuid := '8e02f04e-f0a8-49ac-aa3f-faf6c36a73b7';
  v_ficha_gratis uuid := '8f74d594-94a7-4815-a1df-7e114445af19';
  v_canal_ifood uuid := '1dc4bd83-65e8-4efb-86fa-0cc748876eaf';

  v_cliente uuid;
  v_pedido1 uuid;
  v_integracao uuid;
  v_resolvido uuid;
  v_resultado record;
  v_count int;
  v_func uuid;
begin
  perform set_config('request.jwt.claim.sub', v_dono::text, true);
  set local role authenticated;

  -- ---- 1. Idempotência de pedido externo ---------------------------------
  insert into public.pedidos (empresa_id, tipo, provedor_origem, id_externo)
    values (v_empresa, 'entrega', 'ifood', 'PED-TESTE-001')
    returning id into v_pedido1;

  begin
    insert into public.pedidos (empresa_id, tipo, provedor_origem, id_externo)
      values (v_empresa, 'entrega', 'ifood', 'PED-TESTE-001');
    insert into resultados (caso, passou, detalhe) values (
      'Idempotência: reentrega do mesmo pedido externo é bloqueada', false, 'não levantou exceção'
    );
  exception when unique_violation then
    insert into resultados (caso, passou, detalhe) values (
      'Idempotência: reentrega do mesmo pedido externo é bloqueada', true, sqlerrm
    );
  end;

  insert into public.pedidos (empresa_id, tipo) values (v_empresa, 'balcao');
  insert into public.pedidos (empresa_id, tipo) values (v_empresa, 'balcao');
  insert into resultados (caso, passou, detalhe) values (
    'Idempotência: pedidos internos (sem id_externo) nunca colidem entre si', true, 'dois inserts sem erro'
  );

  -- ---- 2. Resolução de empresa_id do webhook -----------------------------
  insert into public.integracoes_canais (empresa_id, provedor, canal_venda_id, identificador_externo)
    values (v_empresa, 'ifood', v_canal_ifood, 'MERCHANT-TESTE-123')
    returning id into v_integracao;

  select public.fn_resolver_empresa_webhook_integracao('ifood', 'MERCHANT-TESTE-123') into v_resolvido;
  insert into resultados (caso, passou, detalhe) values (
    'Webhook: resolve empresa_id certo a partir do identificador_externo',
    v_resolvido = v_empresa,
    format('resolvido=%s esperado=%s', v_resolvido, v_empresa)
  );

  select public.fn_resolver_empresa_webhook_integracao('ifood', 'MERCHANT-INEXISTENTE') into v_resolvido;
  insert into resultados (caso, passou, detalhe) values (
    'Webhook: identificador desconhecido resolve para null (fica pendente de revisão, não quebra)',
    v_resolvido is null,
    format('resolvido=%s', v_resolvido)
  );

  -- ---- 3. Vínculo integracoes_canais -> canais_venda ---------------------
  select count(*) into v_count
  from public.integracoes_canais ic
  join public.canais_venda cv on cv.id = ic.canal_venda_id
  where ic.id = v_integracao and cv.tipo = 'ifood';
  insert into resultados (caso, passou, detalhe) values (
    'Integrações: canal_venda_id liga a conexão ao canal de venda certo',
    v_count = 1,
    format('linhas=%s', v_count)
  );

  -- ---- 4. Cupom frete_gratis ----------------------------------------------
  insert into public.clientes (empresa_id, nome) values (v_empresa, 'Cliente Teste Cleanup') returning id into v_cliente;

  insert into public.crm_cupons (empresa_id, codigo, tipo, valor)
    values (v_empresa, 'FRETEGRATIS-TESTE', 'frete_gratis', 0);

  select * into v_resultado from public.fn_validar_e_aplicar_cupom('FRETEGRATIS-TESTE', v_cliente, 50.00);
  insert into resultados (caso, passou, detalhe) values (
    'Cupom frete_gratis: RPC devolve tipo=frete_gratis e desconto=0 (frete é zerado no app, não aqui)',
    v_resultado.tipo = 'frete_gratis' and v_resultado.valor_desconto = 0,
    format('tipo=%s desconto=%s', v_resultado.tipo, v_resultado.valor_desconto)
  );

  -- ---- 5. Cupom produto_gratis ---------------------------------------------
  insert into public.crm_cupons (empresa_id, codigo, tipo, valor, ficha_tecnica_gratis_id)
    values (v_empresa, 'PRODUTOGRATIS-TESTE', 'produto_gratis', 0, v_ficha_gratis);

  select * into v_resultado from public.fn_validar_e_aplicar_cupom('PRODUTOGRATIS-TESTE', v_cliente, 50.00);
  insert into resultados (caso, passou, detalhe) values (
    'Cupom produto_gratis: RPC devolve a ficha técnica concedida',
    v_resultado.tipo = 'produto_gratis' and v_resultado.ficha_tecnica_gratis_id = v_ficha_gratis,
    format('tipo=%s ficha=%s', v_resultado.tipo, v_resultado.ficha_tecnica_gratis_id)
  );

  -- ---- 6. RLS de funcionarios -----------------------------------------------
  insert into public.funcionarios (empresa_id, nome, tipo_contratacao, salario_base, carga_horaria_semanal, encargos_percentual, beneficios_valor)
    values (v_empresa, 'Funcionário Teste', 'clt', 3000, 44, 35, 400)
    returning id into v_func;

  select count(*) into v_count from public.funcionarios where empresa_id = v_empresa_outra;
  insert into resultados (caso, passou, detalhe) values (
    'RLS: dono da Cantina não enxerga funcionários de outra empresa',
    v_count = 0,
    format('linhas visíveis=%s', v_count)
  );

  perform set_config('request.jwt.claim.sub', v_usuario_sem_papel::text, true);
  begin
    insert into public.funcionarios (empresa_id, nome, salario_base, carga_horaria_semanal)
      values (v_empresa, 'Não deveria conseguir', 1000, 44);
    insert into resultados (caso, passou, detalhe) values (
      'RLS: usuário sem vínculo não pode inserir funcionário', false, 'insert não bloqueado'
    );
  exception when others then
    insert into resultados (caso, passou, detalhe) values (
      'RLS: usuário sem vínculo não pode inserir funcionário', true, sqlerrm
    );
  end;

  perform set_config('request.jwt.claim.sub', v_dono::text, true);
end $$;

select caso, passou, detalhe from resultados order by criado_em;

rollback;
