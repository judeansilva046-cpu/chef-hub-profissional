-- Sprint 05 (checkpoint 2): Expedição. A fila é alimentada automaticamente
-- quando um pedido de entrega/retirada fica pronto (trigger abaixo) — a
-- tela de Expedição não escreve pedido nenhum diretamente, só avança o
-- status da expedição, que por sua vez sincroniza de volta o status do
-- pedido reaproveitando fn_concluir_pedido (0033) — sem duplicar a criação
-- de venda nem a transição de status em dois lugares.

create table public.entregadores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  telefone text,
  veiculo text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index entregadores_empresa_ativo_idx on public.entregadores (empresa_id, ativo);

alter table public.entregadores enable row level security;

create policy "entregadores_select_own" on public.entregadores
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "entregadores_insert_own" on public.entregadores
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "entregadores_update_own" on public.entregadores
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger entregadores_set_atualizado_em
  before update on public.entregadores
  for each row execute function public.set_atualizado_em();

create table public.expedicoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  status text not null default 'aguardando' check (
    status in ('aguardando', 'conferido', 'embalado', 'saiu', 'entregue')
  ),
  responsavel_id uuid references public.profiles (id),
  entregador_id uuid references public.entregadores (id) on delete set null,
  horario_saida timestamptz,
  horario_entrega timestamptz,
  observacoes text,
  criado_em timestamptz not null default now()
);

create unique index expedicoes_pedido_key on public.expedicoes (pedido_id);
create index expedicoes_empresa_status_idx on public.expedicoes (empresa_id, status, criado_em);

alter table public.expedicoes enable row level security;

create policy "expedicoes_select_own" on public.expedicoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "expedicoes_insert_own" on public.expedicoes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "expedicoes_update_own" on public.expedicoes
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Popula a fila de expedição automaticamente quando um pedido de
-- entrega/retirada/consumo_local fica pronto — evita depender da tela de
-- Expedição (ou de quem confirma o preparo) lembrar de criar o registro.
-- Balcão/mesa não passam por expedição (consumidos/entregues no local).
create function public.pedidos_criar_expedicao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'pronto' and old.status <> 'pronto' and new.tipo in ('entrega', 'retirada') then
    insert into public.expedicoes (empresa_id, pedido_id, responsavel_id)
    values (new.empresa_id, new.id, auth.uid())
    on conflict (pedido_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger pedidos_after_update_criar_expedicao
  after update on public.pedidos
  for each row execute function public.pedidos_criar_expedicao();

-- Sincroniza de volta o status do pedido quando a expedição avança —
-- reaproveita fn_concluir_pedido (0033) para "entregue" em vez de duplicar
-- a criação de vendas aqui.
create function public.expedicoes_sincronizar_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'saiu' and old.status <> 'saiu' then
    update public.pedidos set status = 'saiu_para_entrega' where id = new.pedido_id and status = 'pronto';
  end if;

  if new.status = 'entregue' and old.status <> 'entregue' then
    perform public.fn_concluir_pedido(new.pedido_id);
  end if;

  return new;
end;
$$;

create trigger expedicoes_after_update_sincronizar
  after update on public.expedicoes
  for each row execute function public.expedicoes_sincronizar_pedido();
