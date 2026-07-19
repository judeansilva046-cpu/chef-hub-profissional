-- Sprint 07: Programa de Fidelidade (pontos). Ledger append-only, mesmo
-- princípio de estoque_movimentacoes (0013) e financeiro_auditoria (0043):
-- nenhuma linha é alterada depois de gravada, todo ajuste (resgate, estorno,
-- expiração) é uma nova linha com sinal oposto. `pontos` é sempre assinado
-- (positivo em ganho/estorno, negativo em resgate/expiração), então o saldo
-- de um cliente é sempre soma direta, sem lógica condicional na leitura.

create table public.crm_fidelidade_config (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  ativo boolean not null default false,
  -- Pontos concedidos por R$1,00 em compras (ex: 1 = 1 ponto por real).
  pontos_por_valor numeric(10, 4) not null default 1 check (pontos_por_valor >= 0),
  -- Valor em R$ de cada ponto no resgate (ex: 0.01 = 100 pontos = R$1,00).
  -- Guardado aqui só como referência para a UI calcular o valor do resgate;
  -- o resgate em si é sempre lançado em pontos (crm_fidelidade_movimentacoes),
  -- nunca em R$, para não misturar a unidade do ledger.
  valor_ponto_resgate numeric(10, 4) not null default 0.01 check (valor_ponto_resgate >= 0),
  -- null = pontos nunca expiram.
  validade_dias integer check (validade_dias is null or validade_dias > 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.crm_fidelidade_config enable row level security;

create policy "crm_fidelidade_config_select_own" on public.crm_fidelidade_config
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_fidelidade_config_insert_own" on public.crm_fidelidade_config
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_fidelidade_config_update_own" on public.crm_fidelidade_config
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_fidelidade_config_set_atualizado_em
  before update on public.crm_fidelidade_config
  for each row execute function public.set_atualizado_em();

-- Níveis de fidelidade (ex: Bronze/Prata/Ouro por faixa de pontos
-- acumulados) — só metadado descritivo; qual nível um cliente está em cada
-- momento é sempre calculado comparando o saldo (ou total histórico
-- acumulado, ver queries) contra pontos_minimos, nunca gravado no cliente.
create table public.crm_fidelidade_niveis (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  pontos_minimos numeric(12, 2) not null default 0 check (pontos_minimos >= 0),
  beneficios text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, nome)
);

create index crm_fidelidade_niveis_empresa_idx on public.crm_fidelidade_niveis (empresa_id, ordem);

alter table public.crm_fidelidade_niveis enable row level security;

create policy "crm_fidelidade_niveis_select_own" on public.crm_fidelidade_niveis
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_fidelidade_niveis_insert_own" on public.crm_fidelidade_niveis
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_fidelidade_niveis_update_own" on public.crm_fidelidade_niveis
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_fidelidade_niveis_delete_own" on public.crm_fidelidade_niveis
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_fidelidade_niveis_set_atualizado_em
  before update on public.crm_fidelidade_niveis
  for each row execute function public.set_atualizado_em();

create table public.crm_fidelidade_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo text not null check (tipo in ('ganho', 'resgate', 'estorno', 'expiracao')),
  pontos numeric(12, 2) not null,
  saldo_apos numeric(12, 2) not null,
  validade_em date,
  expirado boolean not null default false,
  referencia_tipo text check (referencia_tipo in ('venda', 'pedido', 'manual', 'movimentacao')),
  referencia_id uuid,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index crm_fidelidade_mov_cliente_idx on public.crm_fidelidade_movimentacoes (cliente_id, criado_em desc);
create index crm_fidelidade_mov_empresa_idx on public.crm_fidelidade_movimentacoes (empresa_id, criado_em desc);
create index crm_fidelidade_mov_validade_idx
  on public.crm_fidelidade_movimentacoes (validade_em)
  where tipo = 'ganho' and expirado = false;

alter table public.crm_fidelidade_movimentacoes enable row level security;

-- Sem policy de insert/update/delete para authenticated: é ledger — todo
-- lançamento passa por uma das funções SECURITY DEFINER abaixo, nunca por
-- escrita direta do cliente (mesmo motivo de pedido_status_historico, 0030).
create policy "crm_fidelidade_mov_select_own" on public.crm_fidelidade_movimentacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Saldo por cliente: soma direta do ledger (pontos já vem assinado). Mesma
-- razão de crm_clientes_metricas (0045) para ser view em vez de coluna: não
-- duplicar o que sempre pode ser recalculado a partir do ledger.
create view public.crm_fidelidade_saldos
with (security_invoker = true) as
select
  cliente_id,
  empresa_id,
  coalesce(sum(pontos), 0) as saldo
from public.crm_fidelidade_movimentacoes
group by cliente_id, empresa_id;

-- Concessão automática de pontos por venda — chamada só pela trigger em
-- `vendas` abaixo, nunca diretamente pelo cliente (por isso sem grant para
-- authenticated): deriva a empresa do PRÓPRIO cliente da venda, não de
-- auth.uid(), porque quem grava a venda pode não ser o dono da empresa (é
-- o mesmo caso de pedidos_registrar_status_historico, 0030).
create function public.fn_conceder_pontos_fidelidade(
  p_cliente_id uuid,
  p_valor_compra numeric,
  p_referencia_tipo text,
  p_referencia_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_ativo boolean;
  v_pontos_por_valor numeric;
  v_validade_dias integer;
  v_pontos numeric(12, 2);
  v_saldo_atual numeric(12, 2);
begin
  if p_valor_compra is null or p_valor_compra <= 0 then
    return;
  end if;

  select empresa_id into v_empresa_id from public.clientes where id = p_cliente_id;
  if v_empresa_id is null then
    return;
  end if;

  select ativo, pontos_por_valor, validade_dias
    into v_ativo, v_pontos_por_valor, v_validade_dias
  from public.crm_fidelidade_config
  where empresa_id = v_empresa_id;

  if v_ativo is not true then
    return;
  end if;

  v_pontos := round(p_valor_compra * v_pontos_por_valor, 2);
  if v_pontos <= 0 then
    return;
  end if;

  select coalesce(sum(pontos), 0) into v_saldo_atual
  from public.crm_fidelidade_movimentacoes
  where cliente_id = p_cliente_id;

  insert into public.crm_fidelidade_movimentacoes (
    empresa_id, cliente_id, tipo, pontos, saldo_apos, validade_em, referencia_tipo, referencia_id
  ) values (
    v_empresa_id, p_cliente_id, 'ganho', v_pontos, v_saldo_atual + v_pontos,
    case when v_validade_dias is not null then current_date + v_validade_dias else null end,
    p_referencia_tipo, p_referencia_id
  );
end;
$$;

revoke execute on function public.fn_conceder_pontos_fidelidade(uuid, numeric, text, uuid) from public, anon, authenticated;

create function public.vendas_after_insert_conceder_pontos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cliente_id is not null then
    perform public.fn_conceder_pontos_fidelidade(new.cliente_id, new.valor_total, 'venda', new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.vendas_after_insert_conceder_pontos() from public, anon, authenticated;

create trigger vendas_after_insert_fidelidade
  after insert on public.vendas
  for each row execute function public.vendas_after_insert_conceder_pontos();

-- Concessão manual (ex: bônus de boas-vindas, compensação) — diferente de
-- fn_conceder_pontos_fidelidade (só-trigger), esta é chamável pela aplicação,
-- então precisa validar explicitamente que o cliente pertence à empresa do
-- usuário autenticado antes de escrever (mesma checagem manual de
-- fn_buscar_usuario_por_email, 0044, já que SECURITY DEFINER passa por cima
-- da RLS de crm_fidelidade_movimentacoes).
create function public.fn_conceder_pontos_manual(
  p_cliente_id uuid,
  p_pontos numeric,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_validade_dias integer;
  v_saldo_atual numeric(12, 2);
begin
  if p_pontos is null or p_pontos <= 0 then
    raise exception 'Informe uma quantidade de pontos maior que zero.';
  end if;

  select c.empresa_id into v_empresa_id
  from public.clientes c
  where c.id = p_cliente_id
    and c.empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if v_empresa_id is null then
    raise exception 'Cliente não encontrado ou sem permissão.';
  end if;

  select validade_dias into v_validade_dias
  from public.crm_fidelidade_config
  where empresa_id = v_empresa_id;

  select coalesce(sum(pontos), 0) into v_saldo_atual
  from public.crm_fidelidade_movimentacoes
  where cliente_id = p_cliente_id;

  insert into public.crm_fidelidade_movimentacoes (
    empresa_id, cliente_id, tipo, pontos, saldo_apos, validade_em, referencia_tipo, observacao, criado_por
  ) values (
    v_empresa_id, p_cliente_id, 'ganho', p_pontos, v_saldo_atual + p_pontos,
    case when v_validade_dias is not null then current_date + v_validade_dias else null end,
    'manual', p_observacao, auth.uid()
  );
end;
$$;

grant execute on function public.fn_conceder_pontos_manual(uuid, numeric, text) to authenticated;
revoke execute on function public.fn_conceder_pontos_manual(uuid, numeric, text) from public, anon;

create function public.fn_resgatar_pontos_fidelidade(
  p_cliente_id uuid,
  p_pontos numeric,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_saldo_atual numeric(12, 2);
begin
  if p_pontos is null or p_pontos <= 0 then
    raise exception 'Informe uma quantidade de pontos maior que zero.';
  end if;

  select c.empresa_id into v_empresa_id
  from public.clientes c
  where c.id = p_cliente_id
    and c.empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if v_empresa_id is null then
    raise exception 'Cliente não encontrado ou sem permissão.';
  end if;

  select coalesce(sum(pontos), 0) into v_saldo_atual
  from public.crm_fidelidade_movimentacoes
  where cliente_id = p_cliente_id;

  if v_saldo_atual < p_pontos then
    raise exception 'Saldo de pontos insuficiente.';
  end if;

  insert into public.crm_fidelidade_movimentacoes (
    empresa_id, cliente_id, tipo, pontos, saldo_apos, referencia_tipo, observacao, criado_por
  ) values (
    v_empresa_id, p_cliente_id, 'resgate', -p_pontos, v_saldo_atual - p_pontos, 'manual', p_observacao, auth.uid()
  );
end;
$$;

grant execute on function public.fn_resgatar_pontos_fidelidade(uuid, numeric, text) to authenticated;
revoke execute on function public.fn_resgatar_pontos_fidelidade(uuid, numeric, text) from public, anon;

-- Estorno de uma movimentação específica (ganho indevido ou resgate
-- cancelado) — lança o inverso exato, nunca apaga/edita a linha original
-- (mesmo princípio de imutabilidade do ledger).
create function public.fn_estornar_movimentacao_fidelidade(
  p_movimentacao_id uuid,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_cliente_id uuid;
  v_pontos numeric(12, 2);
  v_saldo_atual numeric(12, 2);
begin
  select m.empresa_id, m.cliente_id, m.pontos
    into v_empresa_id, v_cliente_id, v_pontos
  from public.crm_fidelidade_movimentacoes m
  where m.id = p_movimentacao_id
    and m.empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if v_cliente_id is null then
    raise exception 'Movimentação não encontrada ou sem permissão.';
  end if;

  select coalesce(sum(pontos), 0) into v_saldo_atual
  from public.crm_fidelidade_movimentacoes
  where cliente_id = v_cliente_id;

  insert into public.crm_fidelidade_movimentacoes (
    empresa_id, cliente_id, tipo, pontos, saldo_apos, referencia_tipo, referencia_id, observacao, criado_por
  ) values (
    v_empresa_id, v_cliente_id, 'estorno', -v_pontos, v_saldo_atual - v_pontos,
    'movimentacao', p_movimentacao_id, p_observacao, auth.uid()
  );
end;
$$;

grant execute on function public.fn_estornar_movimentacao_fidelidade(uuid, text) to authenticated;
revoke execute on function public.fn_estornar_movimentacao_fidelidade(uuid, text) from public, anon;

-- Expiração: sem infraestrutura de job agendado (pg_cron) neste projeto —
-- disparada sob demanda (Server Action/botão "Processar expirados", ver
-- src/features/fidelidade), não automaticamente à meia-noite. FIFO simples:
-- percorre os ganhos vencidos em ordem de validade e expira o menor entre
-- "pontos daquele ganho" e "saldo atual restante", para nunca expirar mais
-- pontos do que o cliente realmente tem.
create function public.fn_expirar_pontos_fidelidade(p_empresa_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ganho record;
  v_saldo_atual numeric(12, 2);
  v_a_expirar numeric(12, 2);
  v_total_expirado integer := 0;
begin
  if p_empresa_id not in (select id from public.empresas where usuario_id = auth.uid()) then
    raise exception 'Empresa não encontrada ou sem permissão.';
  end if;

  for v_ganho in
    select id, cliente_id, pontos
    from public.crm_fidelidade_movimentacoes
    where empresa_id = p_empresa_id
      and tipo = 'ganho'
      and expirado = false
      and validade_em is not null
      and validade_em < current_date
    order by validade_em asc
  loop
    select coalesce(sum(pontos), 0) into v_saldo_atual
    from public.crm_fidelidade_movimentacoes
    where cliente_id = v_ganho.cliente_id;

    v_a_expirar := least(v_ganho.pontos, greatest(v_saldo_atual, 0));

    if v_a_expirar > 0 then
      insert into public.crm_fidelidade_movimentacoes (
        empresa_id, cliente_id, tipo, pontos, saldo_apos, referencia_tipo, referencia_id
      ) values (
        p_empresa_id, v_ganho.cliente_id, 'expiracao', -v_a_expirar, v_saldo_atual - v_a_expirar,
        'movimentacao', v_ganho.id
      );
      v_total_expirado := v_total_expirado + 1;
    end if;

    update public.crm_fidelidade_movimentacoes set expirado = true where id = v_ganho.id;
  end loop;

  return v_total_expirado;
end;
$$;

grant execute on function public.fn_expirar_pontos_fidelidade(uuid) to authenticated;
revoke execute on function public.fn_expirar_pontos_fidelidade(uuid) from public, anon;
