create table public.solicitacoes_compra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'rejeitada', 'convertida')),
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index solicitacoes_compra_empresa_idx on public.solicitacoes_compra (empresa_id, status);

alter table public.solicitacoes_compra enable row level security;

create policy "solicitacoes_compra_select_own" on public.solicitacoes_compra
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "solicitacoes_compra_insert_own" on public.solicitacoes_compra
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "solicitacoes_compra_update_own" on public.solicitacoes_compra
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger solicitacoes_compra_set_updated_at
  before update on public.solicitacoes_compra
  for each row execute function public.set_updated_at();

create table public.solicitacoes_compra_itens (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null references public.solicitacoes_compra (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  quantidade numeric(14, 4) not null check (quantidade > 0),
  observacao text
);

alter table public.solicitacoes_compra_itens enable row level security;

create policy "solicitacoes_compra_itens_all_own" on public.solicitacoes_compra_itens
  for all using (
    exists (
      select 1 from public.solicitacoes_compra s
      join public.empresas e on e.id = s.empresa_id
      where s.id = solicitacoes_compra_itens.solicitacao_id
        and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.solicitacoes_compra s
      join public.empresas e on e.id = s.empresa_id
      where s.id = solicitacoes_compra_itens.solicitacao_id
        and e.usuario_id = (select auth.uid())
    )
  );

create table public.pedidos_compra (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_id uuid not null references public.fornecedores (id) on delete restrict,
  status text not null default 'rascunho' check (
    status in ('rascunho', 'enviado', 'parcialmente_recebido', 'recebido', 'cancelado')
  ),
  data_pedido date not null default current_date,
  data_prevista_entrega date,
  solicitacao_origem_id uuid references public.solicitacoes_compra (id) on delete set null,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pedidos_compra_empresa_idx on public.pedidos_compra (empresa_id, status, data_pedido desc);
create index pedidos_compra_fornecedor_idx on public.pedidos_compra (fornecedor_id);

alter table public.pedidos_compra enable row level security;

create policy "pedidos_compra_select_own" on public.pedidos_compra
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "pedidos_compra_insert_own" on public.pedidos_compra
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "pedidos_compra_update_own" on public.pedidos_compra
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger pedidos_compra_set_updated_at
  before update on public.pedidos_compra
  for each row execute function public.set_updated_at();

create table public.pedidos_compra_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_compra (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  quantidade_pedida numeric(14, 4) not null check (quantidade_pedida > 0),
  preco_unitario numeric(14, 4) not null check (preco_unitario >= 0),
  quantidade_recebida numeric(14, 4) not null default 0 check (quantidade_recebida >= 0),
  valor_total numeric(14, 4) generated always as (quantidade_pedida * preco_unitario) stored
);

create index pedidos_compra_itens_pedido_idx on public.pedidos_compra_itens (pedido_id);

alter table public.pedidos_compra_itens enable row level security;

create policy "pedidos_compra_itens_select_own" on public.pedidos_compra_itens
  for select using (
    exists (
      select 1 from public.pedidos_compra p
      join public.empresas e on e.id = p.empresa_id
      where p.id = pedidos_compra_itens.pedido_id and e.usuario_id = (select auth.uid())
    )
  );
create policy "pedidos_compra_itens_insert_own" on public.pedidos_compra_itens
  for insert with check (
    exists (
      select 1 from public.pedidos_compra p
      join public.empresas e on e.id = p.empresa_id
      where p.id = pedidos_compra_itens.pedido_id and e.usuario_id = (select auth.uid())
    )
  );
-- UPDATE necessário: fn_receber_item_pedido_compra incrementa quantidade_recebida.
create policy "pedidos_compra_itens_update_own" on public.pedidos_compra_itens
  for update using (
    exists (
      select 1 from public.pedidos_compra p
      join public.empresas e on e.id = p.empresa_id
      where p.id = pedidos_compra_itens.pedido_id and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.pedidos_compra p
      join public.empresas e on e.id = p.empresa_id
      where p.id = pedidos_compra_itens.pedido_id and e.usuario_id = (select auth.uid())
    )
  );

-- Recebimento: registra a entrada em estoque (lote novo, FIFO) via a
-- função única de escrita (0014) e atualiza quantidade_recebida + status
-- do pedido. SECURITY INVOKER: todas as tabelas tocadas já têm RLS que o
-- usuário satisfaz (ele é dono da empresa do pedido).
create function public.fn_receber_item_pedido_compra(
  p_pedido_item_id uuid,
  p_quantidade numeric,
  p_numero_lote text default null,
  p_data_validade date default null
)
returns void
language plpgsql
as $$
declare
  v_item public.pedidos_compra_itens%rowtype;
  v_pedido public.pedidos_compra%rowtype;
  v_total_pedido numeric(14, 4);
  v_total_recebido numeric(14, 4);
begin
  select * into v_item from public.pedidos_compra_itens where id = p_pedido_item_id;
  if not found then
    raise exception 'Item de pedido de compra não encontrado';
  end if;

  if p_quantidade <= 0 then
    raise exception 'Quantidade recebida deve ser maior que zero';
  end if;
  if v_item.quantidade_recebida + p_quantidade > v_item.quantidade_pedida then
    raise exception 'Quantidade recebida excede a quantidade pedida';
  end if;

  select * into v_pedido from public.pedidos_compra where id = v_item.pedido_id;

  update public.pedidos_compra_itens
  set quantidade_recebida = quantidade_recebida + p_quantidade
  where id = p_pedido_item_id;

  perform public.fn_registrar_entrada_estoque(
    v_item.ingrediente_id, p_quantidade, v_item.preco_unitario,
    p_numero_lote, p_data_validade, 'compra', v_pedido.id,
    'Recebimento do pedido de compra'
  );

  select coalesce(sum(quantidade_pedida), 0), coalesce(sum(quantidade_recebida), 0)
    into v_total_pedido, v_total_recebido
  from public.pedidos_compra_itens
  where pedido_id = v_pedido.id;

  update public.pedidos_compra
  set status = case
        when v_total_recebido >= v_total_pedido then 'recebido'
        when v_total_recebido > 0 then 'parcialmente_recebido'
        else status
      end
  where id = v_pedido.id;
end;
$$;

grant execute on function public.fn_receber_item_pedido_compra(uuid, numeric, text, date) to authenticated;
