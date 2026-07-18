-- Único caminho de escrita para lotes/movimentações de estoque: entrada
-- cria lote + movimentação; saída consome lotes existentes por FIFO
-- (data_entrada mais antiga primeiro), podendo tocar vários lotes numa
-- única chamada — uma linha de movimentação é gravada por lote consumido,
-- preservando o custo real de cada lote no histórico.
--
-- SECURITY INVOKER (padrão): não precisam bypassar RLS — o usuário já tem
-- SELECT em ingredientes/empresas (para resolver empresa_id) e
-- INSERT/UPDATE em estoque_lotes/estoque_movimentacoes via as policies da
-- migration anterior. Diferente de salvar_ficha_tecnica, aqui não há
-- nenhuma tabela "somente leitura para authenticated" no caminho.

create function public.fn_registrar_entrada_estoque(
  p_ingrediente_id uuid,
  p_quantidade numeric,
  p_custo_unitario numeric,
  p_numero_lote text default null,
  p_data_validade date default null,
  p_referencia_tipo text default 'manual',
  p_referencia_id uuid default null,
  p_observacao text default null
)
returns uuid
language plpgsql
as $$
declare
  v_empresa_id uuid;
  v_lote_id uuid;
begin
  if p_quantidade <= 0 then
    raise exception 'Quantidade de entrada deve ser maior que zero';
  end if;

  select empresa_id into v_empresa_id from public.ingredientes where id = p_ingrediente_id;
  if v_empresa_id is null then
    raise exception 'Ingrediente não encontrado';
  end if;

  insert into public.estoque_lotes (
    empresa_id, ingrediente_id, numero_lote,
    quantidade_inicial, quantidade_atual, custo_unitario, data_validade
  ) values (
    v_empresa_id, p_ingrediente_id, p_numero_lote,
    p_quantidade, p_quantidade, p_custo_unitario, p_data_validade
  )
  returning id into v_lote_id;

  insert into public.estoque_movimentacoes (
    empresa_id, ingrediente_id, lote_id, tipo, quantidade, custo_unitario,
    referencia_tipo, referencia_id, observacao, criado_por
  ) values (
    v_empresa_id, p_ingrediente_id, v_lote_id,
    case when p_referencia_tipo = 'ajuste' then 'ajuste_entrada' else 'entrada' end,
    p_quantidade, p_custo_unitario, p_referencia_tipo, p_referencia_id, p_observacao, auth.uid()
  );

  -- Mantém o custo de referência do ingrediente alinhado com a entrada mais
  -- recente — dispara automaticamente ingredientes_historico_precos (0007).
  update public.ingredientes set custo_unitario_atual = p_custo_unitario where id = p_ingrediente_id;

  return v_lote_id;
end;
$$;

grant execute on function public.fn_registrar_entrada_estoque(
  uuid, numeric, numeric, text, date, text, uuid, text
) to authenticated;

create function public.fn_registrar_saida_estoque(
  p_ingrediente_id uuid,
  p_quantidade numeric,
  p_tipo text default 'saida',
  p_referencia_tipo text default 'manual',
  p_referencia_id uuid default null,
  p_observacao text default null
)
returns void
language plpgsql
as $$
declare
  v_empresa_id uuid;
  v_restante numeric(14, 4) := p_quantidade;
  v_lote record;
  v_consumir numeric(14, 4);
begin
  if p_quantidade <= 0 then
    raise exception 'Quantidade de saída deve ser maior que zero';
  end if;
  if p_tipo not in ('saida', 'ajuste_saida', 'inventario') then
    raise exception 'Tipo de saída inválido: %', p_tipo;
  end if;

  select empresa_id into v_empresa_id from public.ingredientes where id = p_ingrediente_id;
  if v_empresa_id is null then
    raise exception 'Ingrediente não encontrado';
  end if;

  for v_lote in
    select id, quantidade_atual, custo_unitario
    from public.estoque_lotes
    where ingrediente_id = p_ingrediente_id and quantidade_atual > 0
    order by data_entrada asc, id asc
    for update
  loop
    exit when v_restante <= 0;
    v_consumir := least(v_lote.quantidade_atual, v_restante);

    update public.estoque_lotes
    set quantidade_atual = quantidade_atual - v_consumir
    where id = v_lote.id;

    insert into public.estoque_movimentacoes (
      empresa_id, ingrediente_id, lote_id, tipo, quantidade, custo_unitario,
      referencia_tipo, referencia_id, observacao, criado_por
    ) values (
      v_empresa_id, p_ingrediente_id, v_lote.id, p_tipo, v_consumir, v_lote.custo_unitario,
      p_referencia_tipo, p_referencia_id, p_observacao, auth.uid()
    );

    v_restante := v_restante - v_consumir;
  end loop;

  if v_restante > 0 then
    raise exception 'Estoque insuficiente: faltam % unidade(s) para completar a saída', v_restante;
  end if;
end;
$$;

grant execute on function public.fn_registrar_saida_estoque(
  uuid, numeric, text, text, uuid, text
) to authenticated;
