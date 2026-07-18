create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  documento text,
  telefone text,
  email text,
  endereco text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index fornecedores_empresa_nome_key on public.fornecedores (empresa_id, lower(nome));
create index fornecedores_empresa_ativo_idx on public.fornecedores (empresa_id, ativo);

alter table public.fornecedores enable row level security;

-- Sem DELETE: fornecedor pode estar referenciado em pedidos/histórico —
-- "remover" = ativo=false.
create policy "fornecedores_select_own" on public.fornecedores
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "fornecedores_insert_own" on public.fornecedores
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "fornecedores_update_own" on public.fornecedores
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger fornecedores_set_updated_at
  before update on public.fornecedores
  for each row execute function public.set_updated_at();

-- Lista de preços por fornecedor/ingrediente — usada no comparativo de
-- preços e para sugerir fornecedor na lista inteligente de compras.
-- CRUD completo liberado: é só uma tabela de referência, sem trilha de
-- auditoria própria (o histórico real de preços pagos vem de
-- pedidos_compra_itens, não daqui).
create table public.fornecedor_ingredientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_id uuid not null references public.fornecedores (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  preco_unitario numeric(14, 4) not null check (preco_unitario >= 0),
  atualizado_em timestamptz not null default now(),
  unique (fornecedor_id, ingrediente_id)
);

create index fornecedor_ingredientes_ingrediente_idx
  on public.fornecedor_ingredientes (ingrediente_id, preco_unitario);

alter table public.fornecedor_ingredientes enable row level security;

create policy "fornecedor_ingredientes_all_own" on public.fornecedor_ingredientes
  for all using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
