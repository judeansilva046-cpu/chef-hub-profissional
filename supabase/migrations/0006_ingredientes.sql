create table public.ingredientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  categoria_id uuid references public.categorias_ingredientes (id) on delete set null,
  -- on delete restrict: uma unidade em uso por algum ingrediente não pode ser
  -- apagada (força o usuário a reatribuir os ingredientes primeiro).
  unidade_medida_id uuid not null references public.unidades_medida (id) on delete restrict,
  nome text not null,
  custo_unitario_atual numeric(14, 4) not null default 0 check (custo_unitario_atual >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index ingredientes_empresa_nome_key
  on public.ingredientes (empresa_id, lower(nome));

create index ingredientes_empresa_ativo_idx on public.ingredientes (empresa_id, ativo);
create index ingredientes_empresa_categoria_idx on public.ingredientes (empresa_id, categoria_id);
create index ingredientes_nome_trgm_idx on public.ingredientes using gin (nome gin_trgm_ops);

alter table public.ingredientes enable row level security;

-- Sem policy de DELETE: apagar um ingrediente cascatearia (ON DELETE CASCADE)
-- para ingredientes_historico_precos, destruindo o histórico de preços que é
-- um dos requisitos do módulo. "Remover" um ingrediente = marcar ativo=false.
create policy "ingredientes_select_own" on public.ingredientes
  for select using (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create policy "ingredientes_insert_own" on public.ingredientes
  for insert with check (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create policy "ingredientes_update_own" on public.ingredientes
  for update using (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  )
  with check (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create trigger ingredientes_set_updated_at
  before update on public.ingredientes
  for each row execute function public.set_updated_at();
