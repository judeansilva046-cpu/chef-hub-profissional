-- Sprint 08: numeração automática compartilhada por solicitação/cotação/
-- pedido de compra — uma única tabela de contadores por (empresa, tipo) em
-- vez de três tabelas quase idênticas (mesmo princípio de contadores_pedidos,
-- 0030, generalizado porque aqui são 3 sequências independentes, não 1).
create table public.contadores_compras (
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null check (tipo in ('solicitacao', 'cotacao', 'pedido')),
  proximo_numero integer not null default 1,
  primary key (empresa_id, tipo)
);

alter table public.contadores_compras enable row level security;

create policy "contadores_compras_select_own" on public.contadores_compras
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- SECURITY DEFINER: contadores_compras só tem policy de SELECT — quem
-- escreve é sempre esta função (mesmo motivo de fn_proximo_numero_pedido,
-- 0030).
create function public.fn_proximo_numero_compras(p_empresa_id uuid, p_tipo text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
begin
  insert into public.contadores_compras (empresa_id, tipo, proximo_numero)
  values (p_empresa_id, p_tipo, 2)
  on conflict (empresa_id, tipo) do update set proximo_numero = contadores_compras.proximo_numero + 1
  returning proximo_numero - 1 into v_numero;

  return v_numero;
end;
$$;

grant execute on function public.fn_proximo_numero_compras(uuid, text) to authenticated;
revoke execute on function public.fn_proximo_numero_compras(uuid, text) from public, anon;

-- Extensão de solicitacoes_compra (0017): número, quem pediu (reaproveita
-- criado_por já existente — não duplica um "solicitante_id" à parte), setor,
-- centro de custo, prioridade, justificativa e prazo necessário.
alter table public.solicitacoes_compra
  add column numero integer,
  add column setor text,
  add column centro_custo_id uuid references public.centros_custo (id) on delete set null,
  add column prioridade text not null default 'normal' check (prioridade in ('baixa', 'normal', 'alta', 'urgente')),
  add column justificativa text,
  add column data_necessaria date;

create unique index solicitacoes_compra_empresa_numero_key on public.solicitacoes_compra (empresa_id, numero);
create index solicitacoes_compra_centro_custo_idx on public.solicitacoes_compra (centro_custo_id) where centro_custo_id is not null;

create function public.solicitacoes_compra_definir_numero()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.fn_proximo_numero_compras(new.empresa_id, 'solicitacao');
  end if;
  return new;
end;
$$;

create trigger solicitacoes_compra_before_insert_definir_numero
  before insert on public.solicitacoes_compra
  for each row execute function public.solicitacoes_compra_definir_numero();

-- Preço estimado por item: usado para calcular o valor total da solicitação
-- e decidir o nível de aprovação exigido (0057) antes de existir cotação ou
-- pedido — opcional, default 0 (aprovação por valor simplesmente não se
-- aplica quando não informado).
alter table public.solicitacoes_compra_itens
  add column preco_estimado numeric(14, 4) not null default 0 check (preco_estimado >= 0);

-- Histórico de status: append-only, mesmo padrão de pedido_status_historico
-- (0030) — gravado só pela trigger, nunca escrito diretamente pelo cliente.
create table public.solicitacoes_compra_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  solicitacao_id uuid not null references public.solicitacoes_compra (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  motivo text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index solicitacoes_compra_historico_solicitacao_idx
  on public.solicitacoes_compra_historico (solicitacao_id, criado_em);

alter table public.solicitacoes_compra_historico enable row level security;

create policy "solicitacoes_compra_historico_select_own" on public.solicitacoes_compra_historico
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.solicitacoes_compra_registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.solicitacoes_compra_historico (empresa_id, solicitacao_id, status_anterior, status_novo, criado_por)
    values (new.empresa_id, new.id, null, new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.solicitacoes_compra_historico (empresa_id, solicitacao_id, status_anterior, status_novo, criado_por)
    values (new.empresa_id, new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

revoke execute on function public.solicitacoes_compra_registrar_historico() from public, anon, authenticated;

create trigger solicitacoes_compra_after_change_historico
  after insert or update on public.solicitacoes_compra
  for each row execute function public.solicitacoes_compra_registrar_historico();
