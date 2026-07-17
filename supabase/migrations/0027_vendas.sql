-- Sprint 04: registro de vendas realizadas — a base transacional que faltava
-- para Dashboard/Relatórios ("realizado", não só meta/projeção) e para o CRM
-- (ticket médio, frequência, última compra). CRUD simples: diferente de
-- Estoque/Compras/Produção, registrar uma venda aqui NÃO baixa estoque nesta
-- sprint (isso é um ponto de extensão documentado para quando existir
-- integração real de PDV/marketplace — ver docs/ARCHITECTURE.md).
create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ficha_tecnica_id uuid not null references public.fichas_tecnicas (id) on delete restrict,
  canal_venda_id uuid references public.canais_venda (id) on delete set null,
  cliente_id uuid references public.clientes (id) on delete set null,
  quantidade numeric(14, 4) not null check (quantidade > 0),
  preco_unitario_praticado numeric(14, 2) not null check (preco_unitario_praticado >= 0),
  -- Snapshot imutável do custo da ficha no momento da venda (mesmo princípio
  -- de fichas_tecnicas_itens.custo_unitario_utilizado) — nunca informado pelo
  -- cliente da API, sempre gravado pela trigger abaixo. Garante que o CMV
  -- realizado de uma venda antiga não mude silenciosamente quando o custo da
  -- ficha for reajustado depois.
  custo_unitario_snapshot numeric(14, 4) not null default 0,
  valor_total numeric(14, 2) generated always as (quantidade * preco_unitario_praticado) stored,
  margem_total numeric(14, 2)
    generated always as ((preco_unitario_praticado - custo_unitario_snapshot) * quantidade) stored,
  data_venda date not null default current_date,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index vendas_empresa_data_idx on public.vendas (empresa_id, data_venda desc);
create index vendas_empresa_canal_idx on public.vendas (empresa_id, canal_venda_id);
create index vendas_empresa_cliente_idx on public.vendas (empresa_id, cliente_id) where cliente_id is not null;
create index vendas_empresa_ficha_idx on public.vendas (empresa_id, ficha_tecnica_id);

alter table public.vendas enable row level security;

create policy "vendas_select_own" on public.vendas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "vendas_insert_own" on public.vendas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "vendas_update_own" on public.vendas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "vendas_delete_own" on public.vendas
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger vendas_set_atualizado_em
  before update on public.vendas
  for each row execute function public.set_atualizado_em();

-- Defesa em profundidade (mesmo padrão de fichas_tecnicas/estoque): o
-- snapshot de custo é sempre recalculado pela trigger, por qualquer caminho
-- de escrita, nunca confiado ao valor enviado pelo cliente.
create function public.vendas_snapshot_custo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select custo_por_porcao into new.custo_unitario_snapshot
  from public.fichas_tecnicas
  where id = new.ficha_tecnica_id;

  return new;
end;
$$;

revoke execute on function public.vendas_snapshot_custo() from public, anon, authenticated;

create trigger vendas_before_insert_snapshot_custo
  before insert on public.vendas
  for each row execute function public.vendas_snapshot_custo();
