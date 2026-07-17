-- empresa_id nulo = unidade padrão do sistema (seedada abaixo, imutável para
-- qualquer usuário). empresa_id preenchido = unidade customizada da empresa.
create table public.unidades_medida (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  nome text not null,
  sigla text not null,
  -- Sem motor de conversão entre unidades nesta sprint (fora de escopo). Este
  -- campo só habilita agrupar/rotular a UI corretamente (ex: "peso bruto" só
  -- faz sentido para tipo_grandeza = 'massa') e evita migração futura quando
  -- um motor de conversão for construído.
  tipo_grandeza text not null default 'unidade' check (
    tipo_grandeza in ('massa', 'volume', 'unidade')
  ),
  created_at timestamptz not null default now()
);

-- UNIQUE(empresa_id, sigla) não funciona com NULL (NULL <> NULL em SQL), por
-- isso dois índices parciais: sigla única entre as globais, e por empresa
-- entre as customizadas.
create unique index unidades_medida_sistema_sigla_key
  on public.unidades_medida (lower(sigla))
  where empresa_id is null;

create unique index unidades_medida_empresa_sigla_key
  on public.unidades_medida (empresa_id, lower(sigla))
  where empresa_id is not null;

alter table public.unidades_medida enable row level security;

create policy "unidades_medida_select" on public.unidades_medida
  for select using (
    empresa_id is null
    or empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

-- empresa_id is not null nas próximas 3 policies: torna as linhas de sistema
-- automaticamente imutáveis para qualquer usuário, sem policy adicional.
create policy "unidades_medida_insert_own" on public.unidades_medida
  for insert with check (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create policy "unidades_medida_update_own" on public.unidades_medida
  for update using (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  )
  with check (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create policy "unidades_medida_delete_own" on public.unidades_medida
  for delete using (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

insert into public.unidades_medida (empresa_id, nome, sigla, tipo_grandeza) values
  (null, 'Quilograma', 'kg', 'massa'),
  (null, 'Grama', 'g', 'massa'),
  (null, 'Litro', 'l', 'volume'),
  (null, 'Mililitro', 'ml', 'volume'),
  (null, 'Unidade', 'un', 'unidade'),
  (null, 'Dúzia', 'dz', 'unidade'),
  (null, 'Caixa', 'cx', 'unidade'),
  (null, 'Pacote', 'pct', 'unidade');
