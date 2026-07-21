-- Sprint 15: Kitchen Display System operacional.
-- Pré-requisito: 0040+ (status_preparo / RPCs de preparo), 0043+ (RBAC helpers).

-- ---------------------------------------------------------------------------
-- Setores de produção (agrupam praças: Cozinha / Bar / Sobremesas)
-- ---------------------------------------------------------------------------
alter table public.pracas_producao
  add column if not exists setor text;

update public.pracas_producao
set setor = case
  when lower(nome) in ('bebidas', 'bar', 'drinks', 'copa') then 'bar'
  when lower(nome) in ('sobremesas', 'doce', 'doces', 'dessert') then 'sobremesas'
  else 'cozinha'
end
where setor is null;

alter table public.pracas_producao
  alter column setor set default 'cozinha';

alter table public.pracas_producao
  alter column setor set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pracas_producao_setor_check'
  ) then
    alter table public.pracas_producao
      add constraint pracas_producao_setor_check
      check (setor in ('cozinha', 'bar', 'sobremesas'));
  end if;
end $$;

-- Garante praça sistema "Sobremesas" (além de Cozinha/Bebidas já seedadas em 0030).
insert into public.pracas_producao (empresa_id, nome, ordem_exibicao, setor)
select null, 'Sobremesas', 7, 'sobremesas'
where not exists (
  select 1 from public.pracas_producao
  where empresa_id is null and lower(nome) = 'sobremesas'
);

update public.pracas_producao
set setor = 'bar'
where empresa_id is null and lower(nome) = 'bebidas';

update public.pracas_producao
set setor = 'sobremesas'
where empresa_id is null and lower(nome) = 'sobremesas';

-- ---------------------------------------------------------------------------
-- Tempos por item (cronômetros / tempo médio)
-- ---------------------------------------------------------------------------
alter table public.pedido_itens
  add column if not exists preparo_iniciado_em timestamptz,
  add column if not exists pronto_em timestamptz;

create index if not exists pedido_itens_pronto_em_idx
  on public.pedido_itens (empresa_id, pronto_em)
  where pronto_em is not null;

-- ---------------------------------------------------------------------------
-- Configuração do KDS por empresa
-- ---------------------------------------------------------------------------
create table if not exists public.kds_config (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  alerta_atraso_minutos integer not null default 15
    check (alerta_atraso_minutos between 1 and 240),
  alerta_sonoro boolean not null default true,
  impressao_automatica boolean not null default true,
  prioridade_entrega_boost integer not null default 10
    check (prioridade_entrega_boost between 0 and 100),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.kds_config enable row level security;

drop policy if exists "kds_config_select" on public.kds_config;
create policy "kds_config_select" on public.kds_config
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'cozinha', 'caixa', 'garcom', 'financeiro'
    )
  );

drop policy if exists "kds_config_write" on public.kds_config;
create policy "kds_config_write" on public.kds_config
  for all to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  )
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in ('owner', 'gerente')
  );

drop trigger if exists kds_config_updated_at on public.kds_config;
create trigger kds_config_updated_at
  before update on public.kds_config
  for each row execute function public.set_updated_at();

-- set_updated_at usa updated_at; alinhar coluna.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'kds_config' and column_name = 'atualizado_em'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'kds_config' and column_name = 'updated_at'
  ) then
    -- Função genérica espera updated_at — usamos trigger dedicado abaixo.
    null;
  end if;
end $$;

create or replace function public.kds_config_set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists kds_config_updated_at on public.kds_config;
create trigger kds_config_atualizado_em
  before update on public.kds_config
  for each row execute function public.kds_config_set_atualizado_em();

-- ---------------------------------------------------------------------------
-- Histórico operacional do KDS
-- ---------------------------------------------------------------------------
create table if not exists public.kds_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  pedido_item_id uuid references public.pedido_itens (id) on delete set null,
  evento text not null check (evento in (
    'novo',
    'confirmado',
    'iniciou_preparo',
    'item_pronto',
    'pedido_pronto',
    'expedido',
    'entregue',
    'reimpressao',
    'cancelado',
    'alerta_atraso'
  )),
  setor text check (setor is null or setor in ('cozinha', 'bar', 'sobremesas')),
  praca_producao_id uuid references public.pracas_producao (id) on delete set null,
  metadados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.profiles (id) on delete set null
);

create index if not exists kds_events_empresa_criado_idx
  on public.kds_events (empresa_id, criado_em desc);

create index if not exists kds_events_pedido_idx
  on public.kds_events (pedido_id, criado_em desc);

alter table public.kds_events enable row level security;

drop policy if exists "kds_events_select" on public.kds_events;
create policy "kds_events_select" on public.kds_events
  for select to authenticated
  using (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'cozinha', 'caixa', 'garcom'
    )
  );

drop policy if exists "kds_events_insert" on public.kds_events;
create policy "kds_events_insert" on public.kds_events
  for insert to authenticated
  with check (
    empresa_id in (select public.fn_empresas_acessiveis())
    and public.fn_papel_na_empresa(empresa_id) in (
      'owner', 'gerente', 'cozinha', 'caixa', 'garcom'
    )
  );

-- Realtime para painel de histórico
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'kds_events'
  ) then
    alter publication supabase_realtime add table public.kds_events;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helper: registrar evento KDS
-- ---------------------------------------------------------------------------
create or replace function public.fn_registrar_kds_evento(
  p_empresa_id uuid,
  p_pedido_id uuid,
  p_evento text,
  p_pedido_item_id uuid default null,
  p_setor text default null,
  p_praca_producao_id uuid default null,
  p_metadados jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.kds_events (
    empresa_id, pedido_id, pedido_item_id, evento, setor, praca_producao_id, metadados, criado_por
  ) values (
    p_empresa_id,
    p_pedido_id,
    p_pedido_item_id,
    p_evento,
    p_setor,
    p_praca_producao_id,
    coalesce(p_metadados, '{}'::jsonb),
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.fn_registrar_kds_evento(uuid, uuid, text, uuid, text, uuid, jsonb)
  to authenticated;
revoke execute on function public.fn_registrar_kds_evento(uuid, uuid, text, uuid, text, uuid, jsonb)
  from public, anon;

-- ---------------------------------------------------------------------------
-- Atualiza RPCs de preparo com timestamps + eventos
-- ---------------------------------------------------------------------------
create or replace function public.fn_iniciar_preparo_pedido(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_item record;
  v_ficha_item record;
  v_fator numeric(14, 6);
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status <> 'confirmado' then
    raise exception 'Só é possível iniciar preparo de um pedido confirmado';
  end if;

  for v_item in
    select ficha_tecnica_id, quantidade from public.pedido_itens where pedido_id = p_pedido_id
    union all
    select pia.ficha_tecnica_id, pi.quantidade * pia.quantidade
    from public.pedido_item_adicionais pia
    join public.pedido_itens pi on pi.id = pia.pedido_item_id
    where pi.pedido_id = p_pedido_id
  loop
    select rendimento_quantidade into v_fator from public.fichas_tecnicas where id = v_item.ficha_tecnica_id;
    v_fator := v_item.quantidade / v_fator;

    for v_ficha_item in
      select ingrediente_id, peso_bruto
      from public.fichas_tecnicas_itens
      where ficha_tecnica_id = v_item.ficha_tecnica_id
    loop
      perform public.fn_registrar_saida_estoque(
        v_ficha_item.ingrediente_id, v_ficha_item.peso_bruto * v_fator, 'saida',
        'pedido', p_pedido_id,
        'Consumo do pedido #' || v_pedido.numero
      );
    end loop;
  end loop;

  update public.pedido_itens
  set
    status_preparo = 'em_preparo',
    preparo_iniciado_em = coalesce(preparo_iniciado_em, now())
  where pedido_id = p_pedido_id;

  update public.pedidos set status = 'em_preparo' where id = p_pedido_id;

  perform public.fn_registrar_kds_evento(
    v_pedido.empresa_id,
    p_pedido_id,
    'iniciou_preparo',
    null,
    null,
    null,
    jsonb_build_object('numero', v_pedido.numero)
  );
end;
$$;

create or replace function public.fn_marcar_itens_pronto(
  p_pedido_id uuid,
  p_praca_producao_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_updated int;
  v_pendentes int;
  v_setor text;
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status <> 'em_preparo' then
    raise exception 'Pedido precisa estar em preparo';
  end if;

  if p_praca_producao_id is not null then
    select setor into v_setor from public.pracas_producao where id = p_praca_producao_id;
  end if;

  update public.pedido_itens pi
  set
    status_preparo = 'pronto',
    pronto_em = coalesce(pronto_em, now()),
    preparo_iniciado_em = coalesce(preparo_iniciado_em, now())
  from public.fichas_tecnicas ft
  where pi.pedido_id = p_pedido_id
    and pi.ficha_tecnica_id = ft.id
    and pi.status_preparo <> 'pronto'
    and (
      p_praca_producao_id is null
      or ft.praca_producao_id is null
      or ft.praca_producao_id = p_praca_producao_id
    );

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'Nenhum item pendente para marcar como pronto nesta praça';
  end if;

  perform public.fn_registrar_kds_evento(
    v_pedido.empresa_id,
    p_pedido_id,
    'item_pronto',
    null,
    v_setor,
    p_praca_producao_id,
    jsonb_build_object('itens_marcados', v_updated, 'numero', v_pedido.numero)
  );

  select count(*) into v_pendentes
  from public.pedido_itens
  where pedido_id = p_pedido_id and status_preparo <> 'pronto';

  if v_pendentes = 0 then
    update public.pedidos set status = 'pronto' where id = p_pedido_id and status = 'em_preparo';
    perform public.fn_registrar_kds_evento(
      v_pedido.empresa_id,
      p_pedido_id,
      'pedido_pronto',
      null,
      null,
      null,
      jsonb_build_object('numero', v_pedido.numero)
    );
  end if;
end;
$$;

grant execute on function public.fn_marcar_itens_pronto(uuid, uuid) to authenticated;
revoke execute on function public.fn_marcar_itens_pronto(uuid, uuid) from public, anon;

-- Marca um único item como pronto (toggle fino no KDS).
create or replace function public.fn_marcar_item_pronto(p_pedido_item_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item public.pedido_itens%rowtype;
  v_pedido public.pedidos%rowtype;
  v_pendentes int;
  v_setor text;
  v_praca uuid;
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_item from public.pedido_itens where id = p_pedido_item_id;
  if not found then raise exception 'Item não encontrado'; end if;

  select * into v_pedido from public.pedidos where id = v_item.pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status <> 'em_preparo' then
    raise exception 'Pedido precisa estar em preparo';
  end if;
  if v_item.status_preparo = 'pronto' then
    raise exception 'Item já está pronto';
  end if;

  select ft.praca_producao_id, pp.setor
  into v_praca, v_setor
  from public.fichas_tecnicas ft
  left join public.pracas_producao pp on pp.id = ft.praca_producao_id
  where ft.id = v_item.ficha_tecnica_id;

  update public.pedido_itens
  set
    status_preparo = 'pronto',
    pronto_em = coalesce(pronto_em, now()),
    preparo_iniciado_em = coalesce(preparo_iniciado_em, now())
  where id = p_pedido_item_id;

  perform public.fn_registrar_kds_evento(
    v_pedido.empresa_id,
    v_pedido.id,
    'item_pronto',
    p_pedido_item_id,
    v_setor,
    v_praca,
    jsonb_build_object('numero', v_pedido.numero)
  );

  select count(*) into v_pendentes
  from public.pedido_itens
  where pedido_id = v_pedido.id and status_preparo <> 'pronto';

  if v_pendentes = 0 then
    update public.pedidos set status = 'pronto' where id = v_pedido.id and status = 'em_preparo';
    perform public.fn_registrar_kds_evento(
      v_pedido.empresa_id,
      v_pedido.id,
      'pedido_pronto',
      null,
      null,
      null,
      jsonb_build_object('numero', v_pedido.numero)
    );
  end if;
end;
$$;

grant execute on function public.fn_marcar_item_pronto(uuid) to authenticated;
revoke execute on function public.fn_marcar_item_pronto(uuid) from public, anon;

-- Expedição rápida a partir do KDS (balcão / mesa / consumo local).
create or replace function public.fn_expedir_pedido_kds(p_pedido_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
begin
  perform set_config('app.pedido_status_rpc', 'on', true);

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if v_pedido.status <> 'pronto' then
    raise exception 'Pedido precisa estar pronto para expedir';
  end if;

  if v_pedido.tipo in ('entrega', 'retirada') then
    raise exception 'Pedidos de entrega/retirada devem ser expedidos pela tela de Expedição';
  end if;

  update public.pedidos
  set status = 'saiu_para_entrega'
  where id = p_pedido_id and status = 'pronto';

  -- Evento `expedido` é gravado pelo trigger pedidos_after_update_kds_evento.
end;
$$;

grant execute on function public.fn_expedir_pedido_kds(uuid) to authenticated;
revoke execute on function public.fn_expedir_pedido_kds(uuid) from public, anon;

-- Evento ao confirmar pedido (status Novo → Confirmado no KDS).
create or replace function public.pedidos_after_confirm_kds_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmado' and old.status is distinct from 'confirmado' then
    insert into public.kds_events (empresa_id, pedido_id, evento, metadados, criado_por)
    values (
      new.empresa_id,
      new.id,
      'confirmado',
      jsonb_build_object('numero', new.numero, 'tipo', new.tipo),
      auth.uid()
    );
  elsif new.status = 'pronto' and old.status is distinct from 'pronto' then
    -- Evita duplicar quando fn_marcar_* já registrou pedido_pronto no mesmo tick.
    if not exists (
      select 1 from public.kds_events
      where pedido_id = new.id
        and evento = 'pedido_pronto'
        and criado_em > now() - interval '2 seconds'
    ) then
      insert into public.kds_events (empresa_id, pedido_id, evento, metadados, criado_por)
      values (
        new.empresa_id,
        new.id,
        'pedido_pronto',
        jsonb_build_object('numero', new.numero, 'origem', 'status_pedido'),
        auth.uid()
      );
    end if;
  elsif new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    insert into public.kds_events (empresa_id, pedido_id, evento, metadados, criado_por)
    values (
      new.empresa_id,
      new.id,
      'cancelado',
      jsonb_build_object('numero', new.numero, 'motivo', new.motivo_cancelamento),
      auth.uid()
    );
  elsif new.status = 'entregue' and old.status is distinct from 'entregue' then
    insert into public.kds_events (empresa_id, pedido_id, evento, metadados, criado_por)
    values (
      new.empresa_id,
      new.id,
      'entregue',
      jsonb_build_object('numero', new.numero),
      auth.uid()
    );
  elsif new.status = 'saiu_para_entrega' and old.status is distinct from 'saiu_para_entrega' then
    insert into public.kds_events (empresa_id, pedido_id, evento, metadados, criado_por)
    values (
      new.empresa_id,
      new.id,
      'expedido',
      jsonb_build_object('numero', new.numero, 'origem', 'status_pedido'),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists pedidos_after_update_kds_evento on public.pedidos;
create trigger pedidos_after_update_kds_evento
  after update on public.pedidos
  for each row execute function public.pedidos_after_confirm_kds_evento();

-- Seed helper de config KDS
create or replace function public.fn_seed_kds_config(p_empresa_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.kds_config (empresa_id)
  values (p_empresa_id)
  on conflict (empresa_id) do nothing;
end;
$$;

grant execute on function public.fn_seed_kds_config(uuid) to authenticated;
revoke execute on function public.fn_seed_kds_config(uuid) from public, anon;
