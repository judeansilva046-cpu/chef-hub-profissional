-- Hardening de segurança/integridade operacional (pós-auditoria Sprint 05).

-- ---------------------------------------------------------------------------
-- 1) Contador de pedidos: ownership obrigatório
-- ---------------------------------------------------------------------------
create or replace function public.fn_proximo_numero_pedido(p_empresa_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
begin
  if auth.uid() is null
     or not exists (
       select 1 from public.empresas
       where id = p_empresa_id and usuario_id = auth.uid()
     )
  then
    raise exception 'Empresa não encontrada ou não pertence ao usuário atual';
  end if;

  insert into public.contadores_pedidos (empresa_id, proximo_numero)
  values (p_empresa_id, 2)
  on conflict (empresa_id) do update set proximo_numero = contadores_pedidos.proximo_numero + 1
  returning proximo_numero - 1 into v_numero;

  return v_numero;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Status de preparo por item (KDS por praça)
-- ---------------------------------------------------------------------------
alter table public.pedido_itens
  add column if not exists status_preparo text not null default 'pendente';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pedido_itens_status_preparo_check'
  ) then
    alter table public.pedido_itens
      add constraint pedido_itens_status_preparo_check
      check (status_preparo in ('pendente', 'em_preparo', 'pronto'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Expedição: status cancelado (evita sync → concluir no cancelamento)
-- ---------------------------------------------------------------------------
alter table public.expedicoes drop constraint if exists expedicoes_status_check;
alter table public.expedicoes
  add constraint expedicoes_status_check check (
    status in ('aguardando', 'conferido', 'embalado', 'saiu', 'entregue', 'cancelado')
  );

-- ---------------------------------------------------------------------------
-- 4) Guard de status + colunas imutáveis em pedidos
-- ---------------------------------------------------------------------------
create or replace function public.pedidos_before_update_integridade()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_rpc text := current_setting('app.pedido_status_rpc', true);
  v_transicao_ok boolean := false;
begin
  if new.empresa_id is distinct from old.empresa_id then
    raise exception 'empresa_id do pedido é imutável';
  end if;
  if new.numero is distinct from old.numero then
    raise exception 'numero do pedido é imutável';
  end if;

  -- Cliente não sobrescreve totais derivados (RPCs também não mexem nisso)
  if current_setting('app.pedido_status_rpc', true) is distinct from 'on' then
    new.subtotal := old.subtotal;
    new.total := old.total;
  end if;

  if new.status is distinct from old.status then
    if old.status in ('entregue', 'cancelado') then
      raise exception 'Pedido em estado terminal não pode mudar de status';
    end if;

    if v_rpc = 'on' then
      v_transicao_ok := true;
    elsif old.status = 'em_preparo' and new.status = 'pronto' then
      v_transicao_ok := true;
    elsif old.status = 'pronto' and new.status = 'saiu_para_entrega' then
      v_transicao_ok := true;
    end if;

    if not v_transicao_ok then
      raise exception
        'Transição de status % -> % não permitida fora das RPCs controladas',
        old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists pedidos_before_update_integridade on public.pedidos;
create trigger pedidos_before_update_integridade
  before update on public.pedidos
  for each row execute function public.pedidos_before_update_integridade();

create or replace function public.pedidos_valores_only_rascunho()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status <> 'rascunho' and (
    new.desconto_percentual is distinct from old.desconto_percentual
    or new.desconto_valor_fixo is distinct from old.desconto_valor_fixo
    or new.acrescimo_valor is distinct from old.acrescimo_valor
    or new.taxa_entrega is distinct from old.taxa_entrega
  ) then
    raise exception 'Só é possível alterar valores comerciais em pedido rascunho';
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_before_update_valores_rascunho on public.pedidos;
create trigger pedidos_before_update_valores_rascunho
  before update on public.pedidos
  for each row execute function public.pedidos_valores_only_rascunho();

-- ---------------------------------------------------------------------------
-- 5) Itens/adicionais só mutáveis em rascunho (+ mesma empresa)
-- ---------------------------------------------------------------------------
create or replace function public.pedido_itens_before_write_integridade()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_pedido_id uuid;
begin
  v_pedido_id := coalesce(new.pedido_id, old.pedido_id);
  select * into v_pedido from public.pedidos where id = v_pedido_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.empresa_id is distinct from v_pedido.empresa_id then
      raise exception 'empresa_id do item deve coincidir com o pedido';
    end if;
    if not exists (
      select 1 from public.fichas_tecnicas
      where id = new.ficha_tecnica_id and empresa_id = v_pedido.empresa_id
    ) then
      raise exception 'Ficha técnica não pertence à empresa do pedido';
    end if;
  end if;

  if v_pedido.status <> 'rascunho' then
    if tg_op = 'INSERT' then
      raise exception 'Só é possível adicionar itens em pedido rascunho';
    end if;
    if tg_op = 'DELETE' then
      raise exception 'Só é possível remover itens em pedido rascunho';
    end if;
    if tg_op = 'UPDATE' then
      if new.ficha_tecnica_id is distinct from old.ficha_tecnica_id
         or new.quantidade is distinct from old.quantidade
         or new.preco_unitario_praticado is distinct from old.preco_unitario_praticado
         or new.desconto_valor is distinct from old.desconto_valor
         or new.pedido_id is distinct from old.pedido_id
         or new.empresa_id is distinct from old.empresa_id
      then
        raise exception 'Só é possível editar itens em pedido rascunho';
      end if;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists pedido_itens_before_write_integridade on public.pedido_itens;
create trigger pedido_itens_before_write_integridade
  before insert or update or delete on public.pedido_itens
  for each row execute function public.pedido_itens_before_write_integridade();

create or replace function public.pedido_item_adicionais_before_write_integridade()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_item public.pedido_itens%rowtype;
  v_pedido public.pedidos%rowtype;
  v_item_id uuid;
begin
  v_item_id := coalesce(new.pedido_item_id, old.pedido_item_id);
  select * into v_item from public.pedido_itens where id = v_item_id;
  if not found then
    raise exception 'Item do pedido não encontrado';
  end if;
  select * into v_pedido from public.pedidos where id = v_item.pedido_id;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.empresa_id is distinct from v_pedido.empresa_id then
      raise exception 'empresa_id do adicional deve coincidir com o pedido';
    end if;
    if not exists (
      select 1 from public.fichas_tecnicas
      where id = new.ficha_tecnica_id and empresa_id = v_pedido.empresa_id
    ) then
      raise exception 'Adicional não pertence à empresa do pedido';
    end if;
  end if;

  if v_pedido.status <> 'rascunho' then
    raise exception 'Só é possível alterar adicionais em pedido rascunho';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists pedido_item_adicionais_before_write_integridade on public.pedido_item_adicionais;
create trigger pedido_item_adicionais_before_write_integridade
  before insert or update or delete on public.pedido_item_adicionais
  for each row execute function public.pedido_item_adicionais_before_write_integridade();

-- ---------------------------------------------------------------------------
-- 6) RPCs de status (set_config inline — sem helper executável pelo client)
-- ---------------------------------------------------------------------------
create or replace function public.fn_confirmar_pedido(p_pedido_id uuid)
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
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
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
      select pia.ficha_tecnica_id, pi.quantidade * pia.quantidade
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

create or replace function public.fn_iniciar_preparo_pedido(p_pedido_id uuid)
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
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status <> 'confirmado' then
    raise exception 'Só é possível iniciar preparo de um pedido confirmado';
  end if;

  for v_item in
    select ficha_tecnica_id, quantidade from public.pedido_itens where pedido_id = p_pedido_id
    union all
    select pia.ficha_tecnica_id, pi.quantidade * pia.quantidade
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

  update public.pedido_itens
  set status_preparo = 'em_preparo'
  where pedido_id = p_pedido_id;

  update public.pedidos set status = 'em_preparo' where id = p_pedido_id;
end;
$$;

create or replace function public.fn_concluir_pedido(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item record;
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status not in ('pronto', 'saiu_para_entrega') then
    raise exception 'Pedido precisa estar pronto ou saiu para entrega para ser concluído';
  end if;

  if exists (
    select 1 from public.expedicoes
    where pedido_id = p_pedido_id
      and status not in ('entregue', 'cancelado')
  ) and current_setting('app.pedido_concluir_via_expedicao', true) is distinct from 'on' then
    raise exception 'Pedido tem expedição em aberto — conclua pela tela de Expedição';
  end if;

  for v_item in
    select ficha_tecnica_id, quantidade, preco_unitario_praticado
    from public.pedido_itens where pedido_id = p_pedido_id
    union all
    select pia.ficha_tecnica_id, pi.quantidade * pia.quantidade, pia.preco_unitario_praticado
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

create or replace function public.fn_cancelar_pedido(p_pedido_id uuid, p_motivo text)
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
  perform set_config('app.pedido_status_rpc', 'on', true);

  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Motivo do cancelamento é obrigatório';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status = 'cancelado' then
    raise exception 'Pedido já está cancelado';
  end if;
  if v_pedido.status = 'entregue' then
    raise exception 'Pedido entregue não pode ser cancelado';
  end if;

  if v_pedido.status in ('em_preparo', 'pronto', 'saiu_para_entrega') then
    for v_item in
      select ficha_tecnica_id, quantidade from public.pedido_itens where pedido_id = p_pedido_id
      union all
      select pia.ficha_tecnica_id, pi.quantidade * pia.quantidade
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
          v_ficha_item.ingrediente_id,
          v_ficha_item.peso_bruto * v_fator,
          coalesce(v_custo_atual, 0),
          null,
          null,
          'ajuste',
          p_pedido_id,
          'Estorno do cancelamento do pedido #' || v_pedido.numero
        );
      end loop;
    end loop;
  end if;

  update public.expedicoes
  set status = 'cancelado'
  where pedido_id = p_pedido_id
    and status not in ('entregue', 'cancelado');

  update public.pedidos
  set status = 'cancelado', motivo_cancelamento = p_motivo, cancelado_em = now()
  where id = p_pedido_id;
end;
$$;

create or replace function public.fn_avancar_status_pedido(p_pedido_id uuid, p_status_atual text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_proximo text;
  v_updated int;
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  if p_status_atual = 'em_preparo' then
    v_proximo := 'pronto';
  elsif p_status_atual = 'pronto' then
    v_proximo := 'saiu_para_entrega';
  else
    raise exception 'Não há próxima etapa simples para este status';
  end if;

  if v_proximo = 'pronto' then
    update public.pedido_itens
    set status_preparo = 'pronto'
    where pedido_id = p_pedido_id;
  end if;

  update public.pedidos
  set status = v_proximo
  where id = p_pedido_id and status = p_status_atual;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Status do pedido mudou — atualize a tela e tente de novo';
  end if;
end;
$$;

grant execute on function public.fn_avancar_status_pedido(uuid, text) to authenticated;
revoke execute on function public.fn_avancar_status_pedido(uuid, text) from public, anon;

create or replace function public.fn_marcar_itens_pronto(
  p_pedido_id uuid,
  p_praca_producao_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_updated int;
  v_pendentes int;
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status <> 'em_preparo' then
    raise exception 'Pedido precisa estar em preparo';
  end if;

  update public.pedido_itens pi
  set status_preparo = 'pronto'
  from public.fichas_tecnicas ft
  where pi.pedido_id = p_pedido_id
    and pi.ficha_tecnica_id = ft.id
    and pi.status_preparo <> 'pronto'
    and (
      p_praca_producao_id is null
      or ft.praca_producao_id is null
      or ft.praca_producao_id = p_praca_producao_id
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Nenhum item pendente para marcar como pronto nesta praça';
  end if;

  select count(*) into v_pendentes
  from public.pedido_itens
  where pedido_id = p_pedido_id and status_preparo <> 'pronto';

  if v_pendentes = 0 then
    update public.pedidos set status = 'pronto' where id = p_pedido_id and status = 'em_preparo';
  end if;
end;
$$;

grant execute on function public.fn_marcar_itens_pronto(uuid, uuid) to authenticated;
revoke execute on function public.fn_marcar_itens_pronto(uuid, uuid) from public, anon;

create or replace function public.fn_finalizar_venda_pdv(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform set_config('app.pedido_status_rpc', 'on', true);
  perform public.fn_confirmar_pedido(p_pedido_id);
  perform public.fn_iniciar_preparo_pedido(p_pedido_id);

  update public.pedido_itens set status_preparo = 'pronto' where pedido_id = p_pedido_id;
  update public.pedidos set status = 'pronto' where id = p_pedido_id and status = 'em_preparo';

  perform set_config('app.pedido_concluir_via_expedicao', 'on', true);
  perform public.fn_concluir_pedido(p_pedido_id);
end;
$$;

grant execute on function public.fn_finalizar_venda_pdv(uuid) to authenticated;
revoke execute on function public.fn_finalizar_venda_pdv(uuid) from public, anon;

-- Sync expedição → pedido (com flag para conclusão)
create or replace function public.expedicoes_sincronizar_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'saiu' and old.status <> 'saiu' then
    perform set_config('app.pedido_status_rpc', 'on', true);
    update public.pedidos
    set status = 'saiu_para_entrega'
    where id = new.pedido_id and status = 'pronto';
  end if;

  if new.status = 'entregue' and old.status <> 'entregue' then
    perform set_config('app.pedido_concluir_via_expedicao', 'on', true);
    perform public.fn_concluir_pedido(new.pedido_id);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Pagamentos + caixa
-- ---------------------------------------------------------------------------
create or replace function public.fn_registrar_pagamento_pedido(
  p_pedido_id uuid,
  p_caixa_id uuid,
  p_forma_pagamento text,
  p_valor numeric,
  p_troco_para numeric default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_caixa public.caixas%rowtype;
  v_pago numeric(14, 2);
  v_pagamento_id uuid;
begin
  if p_valor <= 0 then
    raise exception 'Valor do pagamento deve ser maior que zero';
  end if;
  if p_troco_para is not null and p_troco_para < p_valor then
    raise exception 'Troco para deve ser maior ou igual ao valor pago';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status in ('cancelado', 'entregue') then
    raise exception 'Não é possível pagar pedido %', v_pedido.status;
  end if;

  select coalesce(sum(valor), 0) into v_pago
  from public.pagamentos where pedido_id = p_pedido_id;

  if v_pago + p_valor > v_pedido.total + 0.009 then
    raise exception 'Pagamento excede o total do pedido (já pago: %, total: %)', v_pago, v_pedido.total;
  end if;

  if p_caixa_id is not null then
    select * into v_caixa from public.caixas where id = p_caixa_id;
    if not found then raise exception 'Caixa não encontrado'; end if;
    if v_caixa.empresa_id <> v_pedido.empresa_id then
      raise exception 'Caixa não pertence à empresa do pedido';
    end if;
    if v_caixa.status <> 'aberto' then
      raise exception 'Caixa já está fechado';
    end if;
    if v_caixa.operador_id <> auth.uid() then
      raise exception 'Só o operador do caixa aberto pode registrar pagamentos nele';
    end if;
  end if;

  insert into public.pagamentos (
    empresa_id, pedido_id, caixa_id, forma_pagamento, valor, troco_para, observacao, criado_por
  ) values (
    v_pedido.empresa_id, p_pedido_id, p_caixa_id, p_forma_pagamento, p_valor, p_troco_para, p_observacao, auth.uid()
  )
  returning id into v_pagamento_id;

  if p_caixa_id is not null then
    perform public.fn_registrar_movimentacao_caixa(
      p_caixa_id, 'venda', p_valor, p_forma_pagamento, 'pedido', p_pedido_id,
      'Pagamento do pedido #' || v_pedido.numero
    );
  end if;

  return v_pagamento_id;
end;
$$;

create or replace function public.fn_registrar_movimentacao_caixa(
  p_caixa_id uuid,
  p_tipo text,
  p_valor numeric,
  p_forma_pagamento text default null,
  p_referencia_tipo text default 'manual',
  p_referencia_id uuid default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caixa public.caixas%rowtype;
  v_movimentacao_id uuid;
begin
  if p_valor <= 0 then
    raise exception 'Valor da movimentação deve ser maior que zero';
  end if;

  select * into v_caixa from public.caixas where id = p_caixa_id;
  if not found then raise exception 'Caixa não encontrado'; end if;
  if v_caixa.status <> 'aberto' then
    raise exception 'Caixa já está fechado';
  end if;
  -- Vendas podem ser registradas pelo fluxo de pagamento (mesmo operador);
  -- movimentações manuais exigem o operador dono do caixa.
  if p_tipo <> 'venda' and v_caixa.operador_id <> auth.uid() then
    raise exception 'Só o operador do caixa pode registrar movimentações manuais';
  end if;

  insert into public.caixa_movimentacoes (
    empresa_id, caixa_id, tipo, valor, forma_pagamento, referencia_tipo, referencia_id, observacao, criado_por
  ) values (
    v_caixa.empresa_id, p_caixa_id, p_tipo, p_valor, p_forma_pagamento, p_referencia_tipo, p_referencia_id, p_observacao, auth.uid()
  )
  returning id into v_movimentacao_id;

  return v_movimentacao_id;
end;
$$;

create or replace function public.fn_fechar_caixa(
  p_caixa_id uuid,
  p_saldo_informado numeric,
  p_observacoes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_caixa public.caixas%rowtype;
  v_esperado numeric(14, 2);
begin
  select * into v_caixa from public.caixas where id = p_caixa_id;
  if not found then raise exception 'Caixa não encontrado'; end if;
  if v_caixa.status <> 'aberto' then
    raise exception 'Caixa já está fechado';
  end if;
  if v_caixa.operador_id <> auth.uid() then
    raise exception 'Só o operador que abriu o caixa pode fechá-lo';
  end if;

  select v_caixa.saldo_inicial
    + coalesce(sum(valor) filter (where tipo in ('entrada', 'suprimento')), 0)
    + coalesce(sum(valor) filter (where tipo = 'venda' and forma_pagamento = 'dinheiro'), 0)
    - coalesce(sum(valor) filter (where tipo = 'sangria'), 0)
  into v_esperado
  from public.caixa_movimentacoes
  where caixa_id = p_caixa_id;

  update public.caixas
  set
    status = 'fechado',
    saldo_esperado = v_esperado,
    saldo_informado = p_saldo_informado,
    observacoes_fechamento = p_observacoes,
    fechado_em = now()
  where id = p_caixa_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8) salvar_ficha_tecnica: ingredientes da mesma empresa
-- ---------------------------------------------------------------------------
create or replace function public.salvar_ficha_tecnica(
  p_ficha_id uuid,
  p_empresa_id uuid,
  p_nome text,
  p_modo_preparo text,
  p_tempo_preparo_minutos integer,
  p_rendimento_quantidade numeric,
  p_rendimento_unidade_id uuid,
  p_preco_venda_praticado numeric,
  p_margem_contribuicao_percentual_alvo numeric,
  p_itens jsonb,
  p_motivo_versao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ficha_id uuid;
  v_proximo_numero_versao integer;
  v_snapshot jsonb;
  v_ingrediente_invalido uuid;
begin
  if not exists (
    select 1 from public.empresas where id = p_empresa_id and usuario_id = auth.uid()
  ) then
    raise exception 'Empresa não encontrada ou não pertence ao usuário atual';
  end if;

  if p_ficha_id is not null and not exists (
    select 1 from public.fichas_tecnicas where id = p_ficha_id and empresa_id = p_empresa_id
  ) then
    raise exception 'Ficha técnica não encontrada nesta empresa';
  end if;

  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'A ficha técnica precisa de ao menos um ingrediente';
  end if;

  select (item ->> 'ingrediente_id')::uuid into v_ingrediente_invalido
  from jsonb_array_elements(p_itens) as item
  where not exists (
    select 1 from public.ingredientes i
    where i.id = (item ->> 'ingrediente_id')::uuid
      and i.empresa_id = p_empresa_id
  )
  limit 1;

  if v_ingrediente_invalido is not null then
    raise exception 'Ingrediente % não pertence à empresa da ficha', v_ingrediente_invalido;
  end if;

  if p_ficha_id is null then
    insert into public.fichas_tecnicas (
      empresa_id, nome, modo_preparo, tempo_preparo_minutos,
      rendimento_quantidade, rendimento_unidade_id,
      preco_venda_praticado, margem_contribuicao_percentual_alvo, created_by
    ) values (
      p_empresa_id, p_nome, p_modo_preparo, p_tempo_preparo_minutos,
      p_rendimento_quantidade, p_rendimento_unidade_id,
      p_preco_venda_praticado, p_margem_contribuicao_percentual_alvo, auth.uid()
    )
    returning id into v_ficha_id;
  else
    v_ficha_id := p_ficha_id;

    update public.fichas_tecnicas set
      nome = p_nome,
      modo_preparo = p_modo_preparo,
      tempo_preparo_minutos = p_tempo_preparo_minutos,
      rendimento_quantidade = p_rendimento_quantidade,
      rendimento_unidade_id = p_rendimento_unidade_id,
      preco_venda_praticado = p_preco_venda_praticado,
      margem_contribuicao_percentual_alvo = p_margem_contribuicao_percentual_alvo
    where id = v_ficha_id;

    delete from public.fichas_tecnicas_itens where ficha_tecnica_id = v_ficha_id;
  end if;

  insert into public.fichas_tecnicas_itens (
    ficha_tecnica_id, ingrediente_id, peso_bruto, percentual_perda, ordem
  )
  select
    v_ficha_id,
    (item ->> 'ingrediente_id')::uuid,
    (item ->> 'peso_bruto')::numeric,
    coalesce((item ->> 'percentual_perda')::numeric, 0),
    coalesce((item ->> 'ordem')::integer, 0)
  from jsonb_array_elements(p_itens) as item;

  select coalesce(max(numero_versao), 0) + 1 into v_proximo_numero_versao
  from public.fichas_tecnicas_versoes where ficha_tecnica_id = v_ficha_id;

  select to_jsonb(ft.*) || jsonb_build_object(
    'itens',
    (select jsonb_agg(to_jsonb(fti.*) order by fti.ordem)
     from public.fichas_tecnicas_itens fti
     where fti.ficha_tecnica_id = v_ficha_id)
  )
  into v_snapshot
  from public.fichas_tecnicas ft
  where ft.id = v_ficha_id;

  insert into public.fichas_tecnicas_versoes (ficha_tecnica_id, numero_versao, snapshot, motivo, criado_por)
  values (v_ficha_id, v_proximo_numero_versao, v_snapshot, p_motivo_versao, auth.uid());

  return v_ficha_id;
end;
$$;
