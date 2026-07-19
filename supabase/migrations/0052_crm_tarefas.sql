-- Sprint 07: Tarefas e follow-up. referencia_tipo/referencia_id: mesmo
-- padrão polimórfico-leve de estoque_movimentacoes (0013) e fila_impressao
-- (0030) — uma tarefa pode estar associada a um cliente OU a um lead, sem
-- duas colunas de FK nullable nem uma tabela de junção.
create table public.crm_tarefas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  titulo text not null,
  descricao text,
  responsavel_id uuid references public.profiles (id),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  prazo timestamptz,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  lembrete_em timestamptz,
  referencia_tipo text check (referencia_tipo in ('cliente', 'lead')),
  referencia_id uuid,
  concluida_em timestamptz,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index crm_tarefas_empresa_status_idx on public.crm_tarefas (empresa_id, status, prazo);
create index crm_tarefas_empresa_responsavel_idx on public.crm_tarefas (empresa_id, responsavel_id);
create index crm_tarefas_referencia_idx
  on public.crm_tarefas (referencia_tipo, referencia_id)
  where referencia_id is not null;

alter table public.crm_tarefas enable row level security;

-- Sem policy de delete: tarefa cancelada é status='cancelada' (soft) — mesmo
-- padrão do resto do módulo.
create policy "crm_tarefas_select_own" on public.crm_tarefas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_tarefas_insert_own" on public.crm_tarefas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_tarefas_update_own" on public.crm_tarefas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_tarefas_set_atualizado_em
  before update on public.crm_tarefas
  for each row execute function public.set_atualizado_em();

-- concluida_em: gravado automaticamente na transição para status='concluida'
-- (nunca aceito diretamente do cliente), mesmo princípio dos timestamps de
-- transição de pedidos (confirmado_em/cancelado_em/entregue_em, 0030).
create function public.crm_tarefas_marcar_concluida()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'concluida' and old.status is distinct from 'concluida' then
    new.concluida_em := now();
  elsif new.status <> 'concluida' then
    new.concluida_em := null;
  end if;
  return new;
end;
$$;

create trigger crm_tarefas_before_update_concluida
  before update on public.crm_tarefas
  for each row execute function public.crm_tarefas_marcar_concluida();
