create table public.categorias_ingredientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  descricao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categorias_ingredientes_empresa_nome_key
  on public.categorias_ingredientes (empresa_id, lower(nome));

create index categorias_ingredientes_empresa_id_idx
  on public.categorias_ingredientes (empresa_id);

alter table public.categorias_ingredientes enable row level security;

-- Cadastro de apoio simples, sem trilha de auditoria própria: CRUD completo
-- liberado para quem é dono da empresa. Apagar uma categoria em uso não
-- destrói dado nenhum (ingredientes.categoria_id é ON DELETE SET NULL).
create policy "categorias_ingredientes_all_own" on public.categorias_ingredientes
  for all using (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  )
  with check (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create trigger categorias_ingredientes_set_updated_at
  before update on public.categorias_ingredientes
  for each row execute function public.set_updated_at();
