-- Sprint 20: ChefHub AI — log de perguntas do copiloto (auditoria / LGPD).

create table if not exists public.ai_query_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  pergunta text not null,
  intencao text not null,
  resposta text not null,
  explicacao text,
  fontes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_query_logs_empresa_created_idx
  on public.ai_query_logs (empresa_id, created_at desc);

alter table public.ai_query_logs enable row level security;

drop policy if exists "ai_query_logs_select" on public.ai_query_logs;
create policy "ai_query_logs_select" on public.ai_query_logs
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

drop policy if exists "ai_query_logs_insert" on public.ai_query_logs;
create policy "ai_query_logs_insert" on public.ai_query_logs
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente', 'financeiro')
  );

comment on table public.ai_query_logs is
  'Perguntas e respostas do ChefHub AI (copiloto de gestão).';
