create table public.listas_compra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  data_inicio_referencia date not null,
  data_fim_referencia date not null,
  status text not null default 'gerada' check (status in ('gerada', 'convertida')),
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index listas_compra_empresa_idx on public.listas_compra (empresa_id, criado_em desc);

alter table public.listas_compra enable row level security;

create policy "listas_compra_select_own" on public.listas_compra
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "listas_compra_insert_own" on public.listas_compra
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "listas_compra_update_own" on public.listas_compra
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create table public.listas_compra_itens (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references public.listas_compra (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  fornecedor_id uuid references public.fornecedores (id) on delete set null,
  quantidade_sugerida numeric(14, 4) not null check (quantidade_sugerida > 0),
  preco_unitario_previsto numeric(14, 4) not null default 0,
  valor_previsto numeric(14, 4) generated always as (quantidade_sugerida * preco_unitario_previsto) stored
);

create index listas_compra_itens_lista_idx on public.listas_compra_itens (lista_id);
create index listas_compra_itens_fornecedor_idx on public.listas_compra_itens (fornecedor_id);

alter table public.listas_compra_itens enable row level security;

-- CRUD completo: itens de rascunho da lista, ajustáveis (ex: definir
-- fornecedor de um item que a geração automática deixou sem sugestão)
-- antes de converter em pedidos.
create policy "listas_compra_itens_all_own" on public.listas_compra_itens
  for all using (
    exists (
      select 1 from public.listas_compra l
      join public.empresas e on e.id = l.empresa_id
      where l.id = listas_compra_itens.lista_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listas_compra l
      join public.empresas e on e.id = l.empresa_id
      where l.id = listas_compra_itens.lista_id and e.usuario_id = (select auth.uid())
    )
  );

-- Gera a lista para o período [p_data_inicio, p_data_fim]: soma o consumo
-- previsto de cada ingrediente (produções planejadas × itens da ficha
-- técnica), soma a reposição de segurança de qualquer ingrediente abaixo
-- do estoque mínimo (mesmo sem produção planejada no período), subtrai o
-- estoque atual, e escolhe o fornecedor de menor preço conhecido
-- (fornecedor_ingredientes) para cada item.
create function public.fn_gerar_lista_compras(
  p_empresa_id uuid,
  p_nome text,
  p_data_inicio date,
  p_data_fim date
)
returns uuid
language plpgsql
as $$
declare
  v_lista_id uuid;
  v_item record;
  v_fornecedor_id uuid;
  v_preco numeric(14, 4);
begin
  insert into public.listas_compra (empresa_id, nome, data_inicio_referencia, data_fim_referencia, criado_por)
  values (p_empresa_id, p_nome, p_data_inicio, p_data_fim, auth.uid())
  returning id into v_lista_id;

  for v_item in
    select
      fti.ingrediente_id as ingrediente_id,
      sum(fti.peso_bruto * (pp.quantidade_planejada / ft.rendimento_quantidade)) as consumo_previsto
    from public.producoes_planejadas pp
    join public.fichas_tecnicas ft on ft.id = pp.ficha_tecnica_id
    join public.fichas_tecnicas_itens fti on fti.ficha_tecnica_id = ft.id
    where pp.empresa_id = p_empresa_id
      and pp.data_producao between p_data_inicio and p_data_fim
      and pp.status in ('planejada', 'em_producao')
    group by fti.ingrediente_id
  loop
    declare
      v_estoque_atual numeric(14, 4);
      v_estoque_minimo numeric(14, 4);
      v_necessidade numeric(14, 4);
    begin
      select coalesce(es.quantidade_total, 0) into v_estoque_atual
      from public.estoque_saldos es
      where es.empresa_id = p_empresa_id and es.ingrediente_id = v_item.ingrediente_id;

      select estoque_minimo into v_estoque_minimo
      from public.ingredientes where id = v_item.ingrediente_id;

      v_necessidade := greatest(0, v_item.consumo_previsto + coalesce(v_estoque_minimo, 0) - coalesce(v_estoque_atual, 0));

      if v_necessidade > 0 then
        select fi.fornecedor_id, fi.preco_unitario into v_fornecedor_id, v_preco
        from public.fornecedor_ingredientes fi
        where fi.ingrediente_id = v_item.ingrediente_id and fi.empresa_id = p_empresa_id
        order by fi.preco_unitario asc
        limit 1;

        insert into public.listas_compra_itens (lista_id, ingrediente_id, fornecedor_id, quantidade_sugerida, preco_unitario_previsto)
        values (v_lista_id, v_item.ingrediente_id, v_fornecedor_id, v_necessidade, coalesce(v_preco, 0));
      end if;
    end;
  end loop;

  -- Reposição de segurança: ingredientes já abaixo do mínimo mesmo sem
  -- nenhuma produção planejada no período (evita ruptura de estoque).
  for v_item in
    select i.id as ingrediente_id, i.estoque_minimo, coalesce(es.quantidade_total, 0) as estoque_atual
    from public.ingredientes i
    left join public.estoque_saldos es on es.ingrediente_id = i.id and es.empresa_id = p_empresa_id
    where i.empresa_id = p_empresa_id
      and i.ativo
      and i.estoque_minimo > coalesce(es.quantidade_total, 0)
      and not exists (
        select 1 from public.listas_compra_itens lci
        where lci.lista_id = v_lista_id and lci.ingrediente_id = i.id
      )
  loop
    declare
      v_necessidade numeric(14, 4) := v_item.estoque_minimo - v_item.estoque_atual;
    begin
      select fi.fornecedor_id, fi.preco_unitario into v_fornecedor_id, v_preco
      from public.fornecedor_ingredientes fi
      where fi.ingrediente_id = v_item.ingrediente_id and fi.empresa_id = p_empresa_id
      order by fi.preco_unitario asc
      limit 1;

      insert into public.listas_compra_itens (lista_id, ingrediente_id, fornecedor_id, quantidade_sugerida, preco_unitario_previsto)
      values (v_lista_id, v_item.ingrediente_id, v_fornecedor_id, v_necessidade, coalesce(v_preco, 0));
    end;
  end loop;

  return v_lista_id;
end;
$$;

grant execute on function public.fn_gerar_lista_compras(uuid, text, date, date) to authenticated;

-- Agrupa os itens da lista por fornecedor e cria um pedido de compra
-- (rascunho) por fornecedor. Exige que todo item já tenha fornecedor
-- definido (a UI deve pedir para o usuário completar itens sem sugestão
-- automática antes de converter).
create function public.fn_converter_lista_em_pedidos(p_lista_id uuid)
returns uuid[]
language plpgsql
as $$
declare
  v_empresa_id uuid;
  v_fornecedor record;
  v_pedido_id uuid;
  v_resultado uuid[] := '{}';
begin
  select empresa_id into v_empresa_id from public.listas_compra where id = p_lista_id;
  if v_empresa_id is null then
    raise exception 'Lista de compras não encontrada';
  end if;

  if exists (
    select 1 from public.listas_compra_itens where lista_id = p_lista_id and fornecedor_id is null
  ) then
    raise exception 'Existem itens sem fornecedor definido — associe um fornecedor antes de converter em pedidos';
  end if;

  for v_fornecedor in
    select distinct fornecedor_id from public.listas_compra_itens where lista_id = p_lista_id
  loop
    insert into public.pedidos_compra (empresa_id, fornecedor_id, status, observacao, criado_por)
    values (v_empresa_id, v_fornecedor.fornecedor_id, 'rascunho', 'Gerado a partir de lista inteligente de compras', auth.uid())
    returning id into v_pedido_id;

    insert into public.pedidos_compra_itens (pedido_id, ingrediente_id, quantidade_pedida, preco_unitario)
    select v_pedido_id, ingrediente_id, quantidade_sugerida, preco_unitario_previsto
    from public.listas_compra_itens
    where lista_id = p_lista_id and fornecedor_id = v_fornecedor.fornecedor_id;

    v_resultado := array_append(v_resultado, v_pedido_id);
  end loop;

  update public.listas_compra set status = 'convertida' where id = p_lista_id;

  return v_resultado;
end;
$$;

grant execute on function public.fn_converter_lista_em_pedidos(uuid) to authenticated;
