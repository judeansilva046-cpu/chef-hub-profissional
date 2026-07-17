-- Um usuário pode ser dono de múltiplas empresas (decisão de produto: sem
-- UNIQUE(usuario_id)). A "empresa ativa" corrente é resolvida na aplicação via
-- cookie (ver src/server/auth/get-empresa-atual.ts), não no banco.
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  tipo_negocio text not null default 'restaurante' check (
    tipo_negocio in (
      'restaurante', 'delivery', 'dark_kitchen', 'padaria',
      'confeitaria', 'cafeteria', 'produtor_artesanal', 'outro'
    )
  ),
  -- Default de margem-alvo usado no cálculo de preço sugerido quando a ficha
  -- técnica não define uma margem própria. Sem tela de configuração nesta
  -- sprint; nullable até existir uma.
  margem_contribuicao_padrao numeric(5, 2) check (
    margem_contribuicao_padrao is null
    or (margem_contribuicao_padrao >= 0 and margem_contribuicao_padrao < 100)
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index empresas_usuario_id_idx on public.empresas (usuario_id);

alter table public.empresas enable row level security;

create policy "empresas_select_own" on public.empresas
  for select using (usuario_id = auth.uid());

create policy "empresas_insert_own" on public.empresas
  for insert with check (usuario_id = auth.uid());

create policy "empresas_update_own" on public.empresas
  for update using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Sem policy de DELETE nesta versão: remover uma empresa é uma decisão
-- destrutiva demais (cascateia ingredientes/fichas técnicas) para expor sem
-- uma tela dedicada de confirmação — fora de escopo desta entrega.

create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();
