-- Sprint 05: transições de status do pedido. Reaproveita 100% da engine de
-- estoque existente (fn_registrar_saida_estoque/fn_registrar_entrada_estoque,
-- 0014) e da tabela vendas (0027) — nenhuma lógica de baixa/custeio ou
-- registro de venda é duplicada aqui, só orquestração.
--
-- "Reservar estoque" na confirmação é validação lógica (compara necessidade
-- agregada dos itens contra estoque_saldos, 0013), sem lock de lote nem
-- tabela de reserva — o consumo real (e o lock FIFO) só acontece ao iniciar
-- o preparo, via fn_registrar_saida_estoque.

create function public.fn_confirmar_pedido(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_bloquear boolean;
  v_faltantes text;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_pedido.status <> 'rascunho' then
    raise exception 'Só é possível confirmar um pedido em rascunho';
  end if;
  if not exists (select 1 from public.pedido_itens where pedido_id = p_pedido_id) then
    raise exception 'Pedido não tem itens';
  end if;

  select bloquear_venda_sem_estoque into v_bloquear
  from public.empresas where id = v_pedido.empresa_id;

  if v_bloquear then
    with itens_expandidos as (
      select ficha_tecnica_id, quantidade from public.pedido_itens where pedido_id = p_pedido_id
      union all
      select pia.ficha_tecnica_id, pia.quantidade
      from public.pedido_item_adicionais pia
      join public.pedido_itens pi on pi.id = pia.pedido_item_id
      where pi.pedido_id = p_pedido_id
    ),
    necessidades as (
      select fti.ingrediente_id, sum(fti.peso_bruto * (ie.quantidade / ft.rendimento_quantidade)) as necessario
      from itens_expandidos ie
      join public.fichas_tecnicas ft on ft.id = ie.ficha_tecnica_id
      join public.fichas_tecnicas_itens fti on fti.ficha_tecnica_id = ft.id
      group by fti.ingrediente_id
    )
    select string_agg(i.nome, ', ') into v_faltantes
    from necessidades n
    join public.ingredientes i on i.id = n.ingrediente_id
    left join public.estoque_saldos es
      on es.ingrediente_id = n.ingrediente_id and es.empresa_id = v_pedido.empresa_id
    where coalesce(es.quantidade_total, 0) < n.necessario;

    if v_faltantes is not null then
      raise exception 'Estoque insuficiente para: %', v_faltantes;
    end if;
  end if;

  update public.pedidos
  set status = 'confirmado', confirmado_em = now()
  where id = p_pedido_id;
end;
$$;

grant execute on function public.fn_confirmar_pedido(uuid) to authenticated;
revoke execute on function public.fn_confirmar_pedido(uuid) from public, anon;

create function public.fn_iniciar_preparo_pedido(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item record;
  v_ficha_item record;
  v_fator numeric(14, 6);
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_pedido.status <> 'confirmado' then
    raise exception 'Só é possível iniciar preparo de um pedido confirmado';
  end if;

  for v_item in
    select ficha_tecnica_id, quantidade from public.pedido_itens where pedido_id = p_pedido_id
    union all
    select pia.ficha_tecnica_id, pia.quantidade
    from public.pedido_item_adicionais pia
    join public.pedido_itens pi on pi.id = pia.pedido_item_id
    where pi.pedido_id = p_pedido_id
  loop
    select rendimento_quantidade into v_fator from public.fichas_tecnicas where id = v_item.ficha_tecnica_id;
    v_fator := v_item.quantidade / v_fator;

    for v_ficha_item in
      select ingrediente_id, peso_bruto
      from public.fichas_tecnicas_itens
      where ficha_tecnica_id = v_item.ficha_tecnica_id
    loop
      perform public.fn_registrar_saida_estoque(
        v_ficha_item.ingrediente_id, v_ficha_item.peso_bruto * v_fator, 'saida',
        'pedido', p_pedido_id,
        'Consumo do pedido #' || v_pedido.numero
      );
    end loop;
  end loop;

  update public.pedidos set status = 'em_preparo' where id = p_pedido_id;
end;
$$;

grant execute on function public.fn_iniciar_preparo_pedido(uuid) to authenticated;
revoke execute on function public.fn_iniciar_preparo_pedido(uuid) from public, anon;

-- Avança pronto/saiu_para_entrega -> entregue e cria as vendas reais (uma
-- linha por item/adicional, mesma granularidade de pedido_itens) —
-- reaproveita a tabela vendas (0027) tal como está, sem nenhuma coluna nova.
create function public.fn_concluir_pedido(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item record;
begin
  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_pedido.status not in ('pronto', 'saiu_para_entrega') then
    raise exception 'Pedido precisa estar pronto ou saiu para entrega para ser concluído';
  end if;

  for v_item in
    select ficha_tecnica_id, quantidade, preco_unitario_praticado
    from public.pedido_itens where pedido_id = p_pedido_id
    union all
    select pia.ficha_tecnica_id, pia.quantidade, pia.preco_unitario_praticado
    from public.pedido_item_adicionais pia
    join public.pedido_itens pi on pi.id = pia.pedido_item_id
    where pi.pedido_id = p_pedido_id
  loop
    insert into public.vendas (
      empresa_id, ficha_tecnica_id, canal_venda_id, cliente_id,
      quantidade, preco_unitario_praticado, data_venda, observacao, criado_por
    ) values (
      v_pedido.empresa_id, v_item.ficha_tecnica_id, v_pedido.canal_venda_id, v_pedido.cliente_id,
      v_item.quantidade, v_item.preco_unitario_praticado, current_date,
      'Pedido #' || v_pedido.numero, auth.uid()
    );
  end loop;

  update public.pedidos set status = 'entregue', entregue_em = now() where id = p_pedido_id;
end;
$$;

grant execute on function public.fn_concluir_pedido(uuid) to authenticated;
revoke execute on function public.fn_concluir_pedido(uuid) from public, anon;

-- Cancelamento: estorna o consumo de estoque quando o pedido já tinha
-- entrado em preparo (usa o custo ATUAL do ingrediente para o estorno —
-- aproximação documentada, já que o FIFO original pode ter consumido de
-- vários lotes com custos diferentes; reverter lote-a-lote exigiria guardar
-- qual lote foi tocado por pedido, fora de escopo desta sprint).
create function public.fn_cancelar_pedido(p_pedido_id uuid, p_motivo text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item record;
  v_ficha_item record;
  v_fator numeric(14, 6);
  v_custo_atual numeric(14, 4);
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Motivo do cancelamento é obrigatório';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_pedido.status = 'cancelado' then
    raise exception 'Pedido já está cancelado';
  end if;

  if v_pedido.status in ('em_preparo', 'pronto', 'saiu_para_entrega', 'entregue') then
    for v_item in
      select ficha_tecnica_id, quantidade from public.pedido_itens where pedido_id = p_pedido_id
      union all
      select pia.ficha_tecnica_id, pia.quantidade
      from public.pedido_item_adicionais pia
      join public.pedido_itens pi on pi.id = pia.pedido_item_id
      where pi.pedido_id = p_pedido_id
    loop
      select rendimento_quantidade into v_fator from public.fichas_tecnicas where id = v_item.ficha_tecnica_id;
      v_fator := v_item.quantidade / v_fator;

      for v_ficha_item in
        select ingrediente_id, peso_bruto
        from public.fichas_tecnicas_itens
        where ficha_tecnica_id = v_item.ficha_tecnica_id
      loop
        select custo_unitario_atual into v_custo_atual
        from public.ingredientes where id = v_ficha_item.ingrediente_id;

        perform public.fn_registrar_entrada_estoque(
          v_ficha_item.ingrediente_id, v_ficha_item.peso_bruto * v_fator, coalesce(v_custo_atual, 0),
          null, null, 'ajuste', p_pedido_id,
          'Estorno do cancelamento do pedido #' || v_pedido.numero
        );
      end loop;
    end loop;
  end if;

  update public.pedidos
  set status = 'cancelado', motivo_cancelamento = p_motivo, cancelado_em = now()
  where id = p_pedido_id;
end;
$$;

grant execute on function public.fn_cancelar_pedido(uuid, text) to authenticated;
revoke execute on function public.fn_cancelar_pedido(uuid, text) from public, anon;
