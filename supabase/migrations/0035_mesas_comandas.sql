-- Sprint 05 (checkpoint 2): Mesas e Comandas. Uma comanda agrupa PEDIDOS
-- (rounds) de uma mesa — não existe comanda_itens: os itens já vivem em
-- pedido_itens via pedidos.comanda_id, reaproveitando 100% do que já foi
-- construído para Pedidos (itens, adicionais, pagamentos, histórico de
-- status). "Divisão de conta" também não precisa de schema novo: pagamentos
-- já suporta múltiplas linhas por pedido_id (0032) — dividir a conta é
-- registrar vários pagamentos que somam o total, não uma tabela nova.

create table public.mesas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  identificador text not null,
  capacidade integer check (capacidade is null or capacidade > 0),
  status text not null default 'livre' check (
    status in ('livre', 'ocupada', 'reservada', 'fechando')
  ),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index mesas_empresa_status_idx on public.mesas (empresa_id, status);

alter table public.mesas enable row level security;

create policy "mesas_select_own" on public.mesas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "mesas_insert_own" on public.mesas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "mesas_update_own" on public.mesas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger mesas_set_atualizado_em
  before update on public.mesas
  for each row execute function public.set_atualizado_em();

create table public.comandas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  mesa_id uuid references public.mesas (id) on delete set null,
  quantidade_pessoas integer check (quantidade_pessoas is null or quantidade_pessoas > 0),
  responsavel_id uuid references public.profiles (id),
  status text not null default 'aberta' check (status in ('aberta', 'fechada')),
  aberta_em timestamptz not null default now(),
  fechada_em timestamptz
);

-- Uma mesa só pode ter uma comanda aberta por vez — mesmo padrão de
-- caixas_operador_aberto_key (0031).
create unique index comandas_mesa_aberta_key
  on public.comandas (mesa_id)
  where status = 'aberta';
create index comandas_empresa_status_idx on public.comandas (empresa_id, status);

alter table public.comandas enable row level security;

create policy "comandas_select_own" on public.comandas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "comandas_insert_own" on public.comandas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "comandas_update_own" on public.comandas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Round de uma comanda: um pedido por "chamada de garçom" (itens novos),
-- todos agrupados pela mesma comanda para fechamento/divisão de conta
-- conjunta.
alter table public.pedidos
  add column comanda_id uuid references public.comandas (id) on delete set null;

create index pedidos_comanda_idx on public.pedidos (comanda_id) where comanda_id is not null;

create function public.fn_abrir_comanda(p_mesa_id uuid, p_quantidade_pessoas integer default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_status_mesa text;
  v_comanda_id uuid;
begin
  select empresa_id, status into v_empresa_id, v_status_mesa from public.mesas where id = p_mesa_id;
  if v_empresa_id is null then
    raise exception 'Mesa não encontrada';
  end if;
  if v_status_mesa = 'ocupada' then
    raise exception 'Mesa já está ocupada';
  end if;

  insert into public.comandas (empresa_id, mesa_id, quantidade_pessoas, responsavel_id)
  values (v_empresa_id, p_mesa_id, p_quantidade_pessoas, auth.uid())
  returning id into v_comanda_id;

  update public.mesas set status = 'ocupada' where id = p_mesa_id;

  return v_comanda_id;
end;
$$;

grant execute on function public.fn_abrir_comanda(uuid, integer) to authenticated;
revoke execute on function public.fn_abrir_comanda(uuid, integer) from public, anon;

-- Fechamento total: só permitido quando todo pedido da comanda já foi
-- entregue ou cancelado (fechamento PARCIAL é simplesmente concluir um
-- pedido/round individual via fn_concluir_pedido, sem fechar a comanda toda
-- — não precisa de função própria).
create function public.fn_fechar_comanda(p_comanda_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_comanda public.comandas%rowtype;
begin
  select * into v_comanda from public.comandas where id = p_comanda_id;
  if not found then
    raise exception 'Comanda não encontrada';
  end if;
  if v_comanda.status <> 'aberta' then
    raise exception 'Comanda já está fechada';
  end if;
  if exists (
    select 1 from public.pedidos
    where comanda_id = p_comanda_id and status not in ('entregue', 'cancelado')
  ) then
    raise exception 'Existem pedidos em aberto nesta comanda';
  end if;

  update public.comandas set status = 'fechada', fechada_em = now() where id = p_comanda_id;

  if v_comanda.mesa_id is not null then
    update public.mesas set status = 'livre' where id = v_comanda.mesa_id;
  end if;
end;
$$;

grant execute on function public.fn_fechar_comanda(uuid) to authenticated;
revoke execute on function public.fn_fechar_comanda(uuid) from public, anon;

create function public.fn_transferir_comanda_mesa(p_comanda_id uuid, p_nova_mesa_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_comanda public.comandas%rowtype;
  v_status_nova_mesa text;
begin
  select * into v_comanda from public.comandas where id = p_comanda_id;
  if not found then
    raise exception 'Comanda não encontrada';
  end if;
  if v_comanda.status <> 'aberta' then
    raise exception 'Comanda não está aberta';
  end if;

  select status into v_status_nova_mesa from public.mesas where id = p_nova_mesa_id;
  if v_status_nova_mesa is null then
    raise exception 'Mesa de destino não encontrada';
  end if;
  if v_status_nova_mesa = 'ocupada' then
    raise exception 'Mesa de destino já está ocupada';
  end if;

  if v_comanda.mesa_id is not null then
    update public.mesas set status = 'livre' where id = v_comanda.mesa_id;
  end if;

  update public.comandas set mesa_id = p_nova_mesa_id where id = p_comanda_id;
  update public.mesas set status = 'ocupada' where id = p_nova_mesa_id;
end;
$$;

grant execute on function public.fn_transferir_comanda_mesa(uuid, uuid) to authenticated;
revoke execute on function public.fn_transferir_comanda_mesa(uuid, uuid) from public, anon;

-- União de mesas: move todos os pedidos da comanda de origem para a de
-- destino e fecha a origem — o "join" acontece nos pedidos, sem duplicar
-- itens.
create function public.fn_unir_comandas(p_comanda_origem_id uuid, p_comanda_destino_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_origem public.comandas%rowtype;
  v_destino public.comandas%rowtype;
begin
  if p_comanda_origem_id = p_comanda_destino_id then
    raise exception 'Selecione duas comandas diferentes';
  end if;

  select * into v_origem from public.comandas where id = p_comanda_origem_id;
  select * into v_destino from public.comandas where id = p_comanda_destino_id;
  if v_origem.id is null or v_destino.id is null then
    raise exception 'Comanda não encontrada';
  end if;
  if v_origem.status <> 'aberta' or v_destino.status <> 'aberta' then
    raise exception 'As duas comandas precisam estar abertas';
  end if;

  update public.pedidos set comanda_id = p_comanda_destino_id where comanda_id = p_comanda_origem_id;

  update public.comandas set status = 'fechada', fechada_em = now() where id = p_comanda_origem_id;

  if v_origem.mesa_id is not null then
    update public.mesas set status = 'livre' where id = v_origem.mesa_id;
  end if;
end;
$$;

grant execute on function public.fn_unir_comandas(uuid, uuid) to authenticated;
revoke execute on function public.fn_unir_comandas(uuid, uuid) from public, anon;
