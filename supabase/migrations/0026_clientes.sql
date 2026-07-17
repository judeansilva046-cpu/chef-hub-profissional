-- Sprint 04: CRM de clientes. Mesmo padrão de fornecedores (migration 0016)
-- — CRUD simples, sem RPC, sem DELETE (cliente pode estar referenciado em
-- vendas antigas — "remover" = ativo=false). Histórico de pedidos, ticket
-- médio, frequência e última compra NÃO são colunas aqui — são sempre
-- derivados de `vendas` (migration 0027) por cliente_id, para não duplicar
-- dado que já existe em outra tabela.
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  documento text,
  endereco text,
  segmento text,
  preferencias text,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index clientes_empresa_ativo_idx on public.clientes (empresa_id, ativo);
create index clientes_empresa_nome_idx on public.clientes (empresa_id, nome);

alter table public.clientes enable row level security;

-- Sem policy de DELETE: mesmo motivo de fornecedores — cliente pode estar
-- referenciado em vendas antigas.
create policy "clientes_select_own" on public.clientes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "clientes_insert_own" on public.clientes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "clientes_update_own" on public.clientes
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger clientes_set_atualizado_em
  before update on public.clientes
  for each row execute function public.set_atualizado_em();
