-- Sprint 07: Cashback. Mesmo padrão de ledger assinado de
-- crm_fidelidade_movimentacoes (0047), só que a unidade é R$ em vez de
-- pontos — por isso duas tabelas de ledger separadas em vez de uma genérica
-- "saldo do cliente": os dois programas têm regras de concessão, validade e
-- limite independentes (uma empresa pode ter só um dos dois ativo).

create table public.crm_cashback_config (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  ativo boolean not null default false,
  tipo text not null default 'percentual' check (tipo in ('percentual', 'fixo')),
  percentual numeric(5, 2) not null default 0 check (percentual >= 0 and percentual <= 100),
  valor_fixo numeric(14, 2) not null default 0 check (valor_fixo >= 0),
  -- Teto de cashback concedido por venda (0 = sem limite) — protege contra
  -- vendas de valor muito alto gerarem crédito desproporcional no modo
  -- percentual.
  limite_por_venda numeric(14, 2) not null default 0 check (limite_por_venda >= 0),
  validade_dias integer check (validade_dias is null or validade_dias > 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.crm_cashback_config enable row level security;

create policy "crm_cashback_config_select_own" on public.crm_cashback_config
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_cashback_config_insert_own" on public.crm_cashback_config
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_cashback_config_update_own" on public.crm_cashback_config
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_cashback_config_set_atualizado_em
  before update on public.crm_cashback_config
  for each row execute function public.set_atualizado_em();

create table public.crm_cashback_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo text not null check (tipo in ('credito', 'resgate', 'estorno', 'expiracao')),
  valor numeric(14, 2) not null,
  saldo_apos numeric(14, 2) not null,
  validade_em date,
  expirado boolean not null default false,
  referencia_tipo text check (referencia_tipo in ('venda', 'pedido', 'manual', 'movimentacao')),
  referencia_id uuid,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index crm_cashback_mov_cliente_idx on public.crm_cashback_movimentacoes (cliente_id, criado_em desc);
create index crm_cashback_mov_empresa_idx on public.crm_cashback_movimentacoes (empresa_id, criado_em desc);
create index crm_cashback_mov_validade_idx
  on public.crm_cashback_movimentacoes (validade_em)
  where tipo = 'credito' and expirado = false;

alter table public.crm_cashback_movimentacoes enable row level security;

create policy "crm_cashback_mov_select_own" on public.crm_cashback_movimentacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create view public.crm_cashback_saldos
with (security_invoker = true) as
select
  cliente_id,
  empresa_id,
  coalesce(sum(valor), 0) as saldo
from public.crm_cashback_movimentacoes
group by cliente_id, empresa_id;

create function public.fn_creditar_cashback(
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
  v_config record;
  v_valor numeric(14, 2);
  v_saldo_atual numeric(14, 2);
begin
  if p_valor_compra is null or p_valor_compra <= 0 then
    return;
  end if;

  select empresa_id into v_empresa_id from public.clientes where id = p_cliente_id;
  if v_empresa_id is null then
    return;
  end if;

  select * into v_config from public.crm_cashback_config where empresa_id = v_empresa_id;
  if v_config.ativo is not true then
    return;
  end if;

  v_valor := case
    when v_config.tipo = 'percentual' then round(p_valor_compra * v_config.percentual / 100, 2)
    else v_config.valor_fixo
  end;

  if v_config.limite_por_venda > 0 and v_valor > v_config.limite_por_venda then
    v_valor := v_config.limite_por_venda;
  end if;

  if v_valor <= 0 then
    return;
  end if;

  select coalesce(sum(valor), 0) into v_saldo_atual
  from public.crm_cashback_movimentacoes
  where cliente_id = p_cliente_id;

  insert into public.crm_cashback_movimentacoes (
    empresa_id, cliente_id, tipo, valor, saldo_apos, validade_em, referencia_tipo, referencia_id
  ) values (
    v_empresa_id, p_cliente_id, 'credito', v_valor, v_saldo_atual + v_valor,
    case when v_config.validade_dias is not null then current_date + v_config.validade_dias else null end,
    p_referencia_tipo, p_referencia_id
  );
end;
$$;

revoke execute on function public.fn_creditar_cashback(uuid, numeric, text, uuid) from public, anon, authenticated;

create function public.vendas_after_insert_creditar_cashback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cliente_id is not null then
    perform public.fn_creditar_cashback(new.cliente_id, new.valor_total, 'venda', new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.vendas_after_insert_creditar_cashback() from public, anon, authenticated;

create trigger vendas_after_insert_cashback
  after insert on public.vendas
  for each row execute function public.vendas_after_insert_creditar_cashback();

create function public.fn_resgatar_cashback(
  p_cliente_id uuid,
  p_valor numeric,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_saldo_atual numeric(14, 2);
begin
  if p_valor is null or p_valor <= 0 then
    raise exception 'Informe um valor de resgate maior que zero.';
  end if;

  select c.empresa_id into v_empresa_id
  from public.clientes c
  where c.id = p_cliente_id
    and c.empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if v_empresa_id is null then
    raise exception 'Cliente não encontrado ou sem permissão.';
  end if;

  select coalesce(sum(valor), 0) into v_saldo_atual
  from public.crm_cashback_movimentacoes
  where cliente_id = p_cliente_id;

  if v_saldo_atual < p_valor then
    raise exception 'Saldo de cashback insuficiente.';
  end if;

  insert into public.crm_cashback_movimentacoes (
    empresa_id, cliente_id, tipo, valor, saldo_apos, referencia_tipo, observacao, criado_por
  ) values (
    v_empresa_id, p_cliente_id, 'resgate', -p_valor, v_saldo_atual - p_valor, 'manual', p_observacao, auth.uid()
  );
end;
$$;

grant execute on function public.fn_resgatar_cashback(uuid, numeric, text) to authenticated;
revoke execute on function public.fn_resgatar_cashback(uuid, numeric, text) from public, anon;

create function public.fn_estornar_movimentacao_cashback(
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
  v_valor numeric(14, 2);
  v_saldo_atual numeric(14, 2);
begin
  select m.empresa_id, m.cliente_id, m.valor
    into v_empresa_id, v_cliente_id, v_valor
  from public.crm_cashback_movimentacoes m
  where m.id = p_movimentacao_id
    and m.empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if v_cliente_id is null then
    raise exception 'Movimentação não encontrada ou sem permissão.';
  end if;

  select coalesce(sum(valor), 0) into v_saldo_atual
  from public.crm_cashback_movimentacoes
  where cliente_id = v_cliente_id;

  insert into public.crm_cashback_movimentacoes (
    empresa_id, cliente_id, tipo, valor, saldo_apos, referencia_tipo, referencia_id, observacao, criado_por
  ) values (
    v_empresa_id, v_cliente_id, 'estorno', -v_valor, v_saldo_atual - v_valor,
    'movimentacao', p_movimentacao_id, p_observacao, auth.uid()
  );
end;
$$;

grant execute on function public.fn_estornar_movimentacao_cashback(uuid, text) to authenticated;
revoke execute on function public.fn_estornar_movimentacao_cashback(uuid, text) from public, anon;

create function public.fn_expirar_cashback(p_empresa_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credito record;
  v_saldo_atual numeric(14, 2);
  v_a_expirar numeric(14, 2);
  v_total_expirado integer := 0;
begin
  if p_empresa_id not in (select id from public.empresas where usuario_id = auth.uid()) then
    raise exception 'Empresa não encontrada ou sem permissão.';
  end if;

  for v_credito in
    select id, cliente_id, valor
    from public.crm_cashback_movimentacoes
    where empresa_id = p_empresa_id
      and tipo = 'credito'
      and expirado = false
      and validade_em is not null
      and validade_em < current_date
    order by validade_em asc
  loop
    select coalesce(sum(valor), 0) into v_saldo_atual
    from public.crm_cashback_movimentacoes
    where cliente_id = v_credito.cliente_id;

    v_a_expirar := least(v_credito.valor, greatest(v_saldo_atual, 0));

    if v_a_expirar > 0 then
      insert into public.crm_cashback_movimentacoes (
        empresa_id, cliente_id, tipo, valor, saldo_apos, referencia_tipo, referencia_id
      ) values (
        p_empresa_id, v_credito.cliente_id, 'expiracao', -v_a_expirar, v_saldo_atual - v_a_expirar,
        'movimentacao', v_credito.id
      );
      v_total_expirado := v_total_expirado + 1;
    end if;

    update public.crm_cashback_movimentacoes set expirado = true where id = v_credito.id;
  end loop;

  return v_total_expirado;
end;
$$;

grant execute on function public.fn_expirar_cashback(uuid) to authenticated;
revoke execute on function public.fn_expirar_cashback(uuid) from public, anon;
