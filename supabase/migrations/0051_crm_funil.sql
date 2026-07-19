-- Sprint 07: Funil comercial. Modela Lead e Oportunidade como o MESMO
-- registro (crm_leads) avançando por etapas configuráveis, em vez de duas
-- tabelas quase idênticas — um lead "vira" oportunidade só por progredir de
-- etapa (mesmo princípio de não duplicar entidades já estabelecido no
-- projeto: pedidos usa um único registro + pedido_status_historico para
-- toda a máquina de estados, em vez de uma tabela por status).
create table public.crm_funil_etapas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  cor text not null default '#64748b',
  -- Marca as etapas terminais (coluna final do Kanban) sem depender do nome
  -- exato "Ganho"/"Perdido" ser mantido pelo usuário ao editar/renomear.
  tipo_final text check (tipo_final in ('ganho', 'perdido')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, nome)
);

create index crm_funil_etapas_empresa_idx on public.crm_funil_etapas (empresa_id, ordem);

alter table public.crm_funil_etapas enable row level security;

create policy "crm_funil_etapas_select_own" on public.crm_funil_etapas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_funil_etapas_insert_own" on public.crm_funil_etapas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_funil_etapas_update_own" on public.crm_funil_etapas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_funil_etapas_set_atualizado_em
  before update on public.crm_funil_etapas
  for each row execute function public.set_atualizado_em();

insert into public.crm_funil_etapas (empresa_id, nome, ordem, cor, tipo_final)
select empresas.id, padrao.nome, padrao.ordem, padrao.cor, padrao.tipo_final
from public.empresas
cross join (
  values
    ('Novo Lead', 1, '#64748b', null),
    ('Contato Feito', 2, '#0ea5e9', null),
    ('Proposta', 3, '#f59e0b', null),
    ('Negociação', 4, '#8b5cf6', null),
    ('Ganho', 5, '#22c55e', 'ganho'),
    ('Perdido', 6, '#ef4444', 'perdido')
) as padrao (nome, ordem, cor, tipo_final);

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  origem text,
  responsavel_id uuid references public.profiles (id),
  etapa_id uuid not null references public.crm_funil_etapas (id) on delete restrict,
  valor_estimado numeric(14, 2) not null default 0 check (valor_estimado >= 0),
  probabilidade numeric(5, 2) not null default 0 check (probabilidade >= 0 and probabilidade <= 100),
  proxima_acao text,
  proxima_acao_em date,
  status text not null default 'aberto' check (status in ('aberto', 'convertido', 'perdido')),
  motivo_perda text,
  -- Preenchido só na conversão (fn_converter_lead_em_cliente abaixo) — nunca
  -- aceito diretamente do cliente da API, para não permitir vincular um lead
  -- a um cliente de outra empresa.
  cliente_id uuid references public.clientes (id) on delete set null,
  convertido_em timestamptz,
  observacoes text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index crm_leads_empresa_etapa_idx on public.crm_leads (empresa_id, etapa_id);
create index crm_leads_empresa_status_idx on public.crm_leads (empresa_id, status);
create index crm_leads_empresa_responsavel_idx on public.crm_leads (empresa_id, responsavel_id);

alter table public.crm_leads enable row level security;

-- Sem policy de delete: lead perdido é status='perdido' (soft), não removido
-- — mesmo padrão de clientes/fornecedores.
create policy "crm_leads_select_own" on public.crm_leads
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_leads_insert_own" on public.crm_leads
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_leads_update_own" on public.crm_leads
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_leads_set_atualizado_em
  before update on public.crm_leads
  for each row execute function public.set_atualizado_em();

-- Histórico de etapas: append-only, mesmo padrão de pedido_status_historico
-- (0030) — gravado só pela trigger, nunca escrito diretamente.
create table public.crm_leads_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  lead_id uuid not null references public.crm_leads (id) on delete cascade,
  etapa_anterior_id uuid references public.crm_funil_etapas (id),
  etapa_nova_id uuid not null references public.crm_funil_etapas (id),
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index crm_leads_historico_lead_idx on public.crm_leads_historico (lead_id, criado_em);

alter table public.crm_leads_historico enable row level security;

create policy "crm_leads_historico_select_own" on public.crm_leads_historico
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.crm_leads_registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.crm_leads_historico (empresa_id, lead_id, etapa_anterior_id, etapa_nova_id, criado_por)
    values (new.empresa_id, new.id, null, new.etapa_id, auth.uid());
    return new;
  end if;

  if new.etapa_id is distinct from old.etapa_id then
    insert into public.crm_leads_historico (empresa_id, lead_id, etapa_anterior_id, etapa_nova_id, criado_por)
    values (new.empresa_id, new.id, old.etapa_id, new.etapa_id, auth.uid());
  end if;

  return new;
end;
$$;

revoke execute on function public.crm_leads_registrar_historico() from public, anon, authenticated;

create trigger crm_leads_after_change_historico
  after insert or update on public.crm_leads
  for each row execute function public.crm_leads_registrar_historico();

-- Conversão em cliente: SECURITY INVOKER (não DEFINER) porque tanto o
-- INSERT em clientes quanto o UPDATE em crm_leads já são permitidos pela RLS
-- do próprio usuário — a função só garante que as duas escritas acontecem
-- atomicamente (mesmo motivo de fn_criar_conta_receber, 0042).
create function public.fn_converter_lead_em_cliente(p_lead_id uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_lead record;
  v_cliente_id uuid;
begin
  select * into v_lead from public.crm_leads where id = p_lead_id;

  if v_lead.id is null then
    raise exception 'Lead não encontrado ou sem permissão.';
  end if;

  if v_lead.cliente_id is not null then
    return v_lead.cliente_id;
  end if;

  insert into public.clientes (empresa_id, nome, telefone, email, origem)
  values (v_lead.empresa_id, v_lead.nome, v_lead.telefone, v_lead.email, v_lead.origem)
  returning id into v_cliente_id;

  update public.crm_leads
  set cliente_id = v_cliente_id, status = 'convertido', convertido_em = now()
  where id = p_lead_id;

  return v_cliente_id;
end;
$$;

grant execute on function public.fn_converter_lead_em_cliente(uuid) to authenticated;
revoke execute on function public.fn_converter_lead_em_cliente(uuid) from public, anon;
