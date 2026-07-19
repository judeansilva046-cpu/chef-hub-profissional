-- Sprint 07: Auditoria do CRM — mesmo padrão genérico de
-- fn_registrar_auditoria_financeira (0043): uma trigger reaproveitável via
-- TG_TABLE_NAME/TG_OP, uma tabela append-only só de leitura para o cliente.
-- Tabela própria (crm_auditoria, não financeiro_auditoria) porque o RLS de
-- select aqui é ownership simples da empresa, sem o fn_tem_acesso_financeiro
-- multiusuário do Financeiro — o CRM não introduziu papéis nesta sprint.
-- Ledgers já append-only (crm_fidelidade_movimentacoes,
-- crm_cashback_movimentacoes, crm_cupons_usos, crm_leads_historico) não
-- precisam de trigger aqui: eles já SÃO o próprio rastro de auditoria.
create table public.crm_auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  dados_antigos jsonb,
  dados_novos jsonb,
  usuario_id uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index crm_auditoria_empresa_idx on public.crm_auditoria (empresa_id, criado_em desc);
create index crm_auditoria_registro_idx on public.crm_auditoria (tabela, registro_id);

alter table public.crm_auditoria enable row level security;

create policy "crm_auditoria_select_own" on public.crm_auditoria
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.fn_registrar_auditoria_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crm_auditoria (
    empresa_id, tabela, registro_id, acao, dados_antigos, dados_novos, usuario_id
  ) values (
    coalesce(new.empresa_id, old.empresa_id),
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    lower(TG_OP),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create trigger clientes_auditoria_crm
  after insert or update on public.clientes
  for each row execute function public.fn_registrar_auditoria_crm();
create trigger crm_leads_auditoria
  after insert or update on public.crm_leads
  for each row execute function public.fn_registrar_auditoria_crm();
create trigger crm_cupons_auditoria
  after insert or update on public.crm_cupons
  for each row execute function public.fn_registrar_auditoria_crm();
create trigger crm_tarefas_auditoria
  after insert or update on public.crm_tarefas
  for each row execute function public.fn_registrar_auditoria_crm();
create trigger crm_segmentos_personalizados_auditoria
  after insert or update on public.crm_segmentos_personalizados
  for each row execute function public.fn_registrar_auditoria_crm();

-- Realtime: só nas tabelas onde múltiplos operadores editando ao mesmo
-- tempo faz diferença visível (Kanban do funil, lista de tarefas) — mesmo
-- critério de seleção da 0037, não uma extensão geral do Realtime para todo
-- o CRM. RLS de cada tabela já protege por linha, nenhuma policy nova
-- necessária (Realtime do Supabase respeita RLS do usuário autenticado).
alter publication supabase_realtime add table public.crm_leads;
alter publication supabase_realtime add table public.crm_tarefas;
