-- Sprint 05: núcleo de Pedidos. Reaproveita clientes (0026), canais_venda
-- (0025) e fichas_tecnicas (0008) por FK — nenhuma dessas entidades é
-- duplicada aqui. Estoque/produção (fn_registrar_saida_estoque/
-- fn_registrar_entrada_estoque, 0014) e vendas (0027) são reaproveitados nas
-- funções de transição de status em 0033, não nesta migration de schema.

-- Config por empresa: bloquear ou não a confirmação de um pedido quando
-- faltar estoque de algum ingrediente (ver fn_confirmar_pedido, 0031).
alter table public.empresas
  add column bloquear_venda_sem_estoque boolean not null default false;

-- Amplia a fila de impressão (0028) para os novos tipos de job da Sprint 05,
-- sem recriar a tabela. referencia_tipo/referencia_id: mesmo padrão
-- polimórfico-leve de estoque_movimentacoes (0013) — permite localizar/
-- reimprimir jobs por pedido/comanda/caixa sem duplicar dados no payload.
alter table public.fila_impressao
  drop constraint fila_impressao_tipo_check;
alter table public.fila_impressao
  add constraint fila_impressao_tipo_check check (
    tipo in (
      'etiqueta_validade', 'comprovante_pedido', 'comprovante_praca',
      'comprovante_expedicao', 'fechamento_caixa'
    )
  );
alter table public.fila_impressao
  add column referencia_tipo text check (
    referencia_tipo in ('pedido', 'comanda', 'caixa', 'expedicao')
  ),
  add column referencia_id uuid;

create index fila_impressao_referencia_idx
  on public.fila_impressao (referencia_tipo, referencia_id)
  where referencia_id is not null;

-- Praças de produção para o KDS (0010 já estabeleceu o padrão "linha de
-- sistema sem empresa_id" em unidades_medida, 0004). As 6 praças mínimas do
-- produto são seedadas como globais (empresa_id null); cada empresa pode
-- adicionar praças próprias.
create table public.pracas_producao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  nome text not null,
  ordem_exibicao integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create unique index pracas_producao_sistema_nome_key
  on public.pracas_producao (lower(nome))
  where empresa_id is null;
create unique index pracas_producao_empresa_nome_key
  on public.pracas_producao (empresa_id, lower(nome))
  where empresa_id is not null;

alter table public.pracas_producao enable row level security;

create policy "pracas_producao_select" on public.pracas_producao
  for select using (
    empresa_id is null
    or empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
create policy "pracas_producao_insert_own" on public.pracas_producao
  for insert with check (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
create policy "pracas_producao_update_own" on public.pracas_producao
  for update using (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  )
  with check (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );

insert into public.pracas_producao (empresa_id, nome, ordem_exibicao) values
  (null, 'Cozinha', 1),
  (null, 'Chapa', 2),
  (null, 'Fritura', 3),
  (null, 'Montagem', 4),
  (null, 'Bebidas', 5),
  (null, 'Expedição', 6);

-- Praça é atributo da própria ficha técnica (não uma tabela de junção
-- pedido_itens_pracas): o KDS filtra pedido_itens pela praça da sua ficha
-- via join, evitando modelar o mesmo vínculo em dois lugares.
-- disponivel_como_adicional: reaproveita fichas_tecnicas para representar
-- add-ons (ex: "queijo extra") em vez de criar um catálogo de preço paralelo
-- — um adicional É uma ficha técnica com este flag, com toda a precificação/
-- custo já resolvidos pela mesma engine.
alter table public.fichas_tecnicas
  add column praca_producao_id uuid references public.pracas_producao (id) on delete set null,
  add column disponivel_como_adicional boolean not null default false;

-- Contador atômico por empresa para numero sequencial do pedido (sem
-- precedente direto no projeto — fichas_tecnicas_versoes.numero_versao usa
-- max()+1 sem lock, aceitável lá pela baixa concorrência por ficha; aqui,
-- múltiplos operadores de PDV podem confirmar pedidos ao mesmo tempo, então
-- usamos INSERT ... ON CONFLICT DO UPDATE, que serializa via lock de linha).
create table public.contadores_pedidos (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  proximo_numero integer not null default 1
);

alter table public.contadores_pedidos enable row level security;

create policy "contadores_pedidos_select_own" on public.contadores_pedidos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- SECURITY DEFINER: contadores_pedidos só tem policy de SELECT para
-- authenticated (mesmo motivo de estoque_saldos, 0013) — quem escreve nela é
-- sempre esta função, nunca o cliente diretamente.
create function public.fn_proximo_numero_pedido(p_empresa_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero integer;
begin
  insert into public.contadores_pedidos (empresa_id, proximo_numero)
  values (p_empresa_id, 2)
  on conflict (empresa_id) do update set proximo_numero = contadores_pedidos.proximo_numero + 1
  returning proximo_numero - 1 into v_numero;

  return v_numero;
end;
$$;

-- Chamada só internamente pela trigger pedidos_definir_numero (que roda
-- como o usuário autenticado) — precisa continuar executável por
-- authenticated (revogar só de anon), mesmo padrão de
-- fn_registrar_entrada_estoque (0014/0020).
grant execute on function public.fn_proximo_numero_pedido(uuid) to authenticated;
revoke execute on function public.fn_proximo_numero_pedido(uuid) from public, anon;

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  -- Nunca aceito do cliente: sempre atribuído pela trigger abaixo via
  -- fn_proximo_numero_pedido, mesmo princípio dos snapshots imutáveis.
  numero integer not null,
  tipo text not null check (
    tipo in ('balcao', 'retirada', 'entrega', 'consumo_local', 'mesa')
  ),
  status text not null default 'rascunho' check (
    status in (
      'rascunho', 'confirmado', 'em_preparo', 'pronto',
      'saiu_para_entrega', 'entregue', 'cancelado'
    )
  ),
  cliente_id uuid references public.clientes (id) on delete set null,
  canal_venda_id uuid references public.canais_venda (id) on delete set null,
  responsavel_id uuid references public.profiles (id),
  -- Campos derivados: recalculados por trigger a partir de pedido_itens/
  -- pedido_item_adicionais (mesmo padrão de fichas_tecnicas.custo_total,
  -- 0009) — nunca escritos diretamente pelo cliente.
  subtotal numeric(14, 2) not null default 0,
  desconto_percentual numeric(5, 2) not null default 0 check (
    desconto_percentual >= 0 and desconto_percentual <= 100
  ),
  desconto_valor_fixo numeric(14, 2) not null default 0 check (desconto_valor_fixo >= 0),
  acrescimo_valor numeric(14, 2) not null default 0 check (acrescimo_valor >= 0),
  taxa_entrega numeric(14, 2) not null default 0 check (taxa_entrega >= 0),
  total numeric(14, 2) not null default 0,
  observacoes text,
  motivo_cancelamento text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  cancelado_em timestamptz,
  entregue_em timestamptz
);

create unique index pedidos_empresa_numero_key on public.pedidos (empresa_id, numero);
create index pedidos_empresa_status_idx on public.pedidos (empresa_id, status, criado_em desc);
create index pedidos_empresa_cliente_idx on public.pedidos (empresa_id, cliente_id) where cliente_id is not null;

alter table public.pedidos enable row level security;

create policy "pedidos_select_own" on public.pedidos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "pedidos_insert_own" on public.pedidos
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "pedidos_update_own" on public.pedidos
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.pedidos_definir_numero()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.fn_proximo_numero_pedido(new.empresa_id);
  end if;
  return new;
end;
$$;

create trigger pedidos_before_insert_definir_numero
  before insert on public.pedidos
  for each row execute function public.pedidos_definir_numero();

create function public.pedidos_calcular_total()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.total := greatest(
    0,
    new.subtotal
      - new.desconto_valor_fixo
      - (new.subtotal * new.desconto_percentual / 100)
      + new.acrescimo_valor
      + new.taxa_entrega
  );
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger pedidos_before_upsert_calcular_total
  before insert or update on public.pedidos
  for each row execute function public.pedidos_calcular_total();

-- Histórico de status: append-only, sem precedente direto no projeto
-- (fichas_tecnicas_versoes é snapshot de linha inteira; estoque_movimentacoes
-- é ledger de quantidade — nenhum dos dois modela uma máquina de estados).
-- Gravado automaticamente pela trigger abaixo, não pela aplicação, para
-- garantir que NENHUMA transição de status (qualquer que seja o caminho de
-- escrita) fique sem rastro.
create table public.pedido_status_historico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  status_anterior text,
  status_novo text not null,
  motivo text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index pedido_status_historico_pedido_idx
  on public.pedido_status_historico (pedido_id, criado_em);

alter table public.pedido_status_historico enable row level security;

create policy "pedido_status_historico_select_own" on public.pedido_status_historico
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- SECURITY DEFINER: pedido_status_historico só tem policy de SELECT para
-- authenticated (é auditoria append-only, nunca escrita direta pelo
-- cliente) — só chamada automaticamente pela trigger abaixo, nunca via
-- `perform`/RPC, então revogar de todos os papéis é seguro (mesmo padrão de
-- vendas_snapshot_custo, 0027).
create function public.pedidos_registrar_status_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.pedido_status_historico (empresa_id, pedido_id, status_anterior, status_novo, criado_por)
    values (new.empresa_id, new.id, null, new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.pedido_status_historico (
      empresa_id, pedido_id, status_anterior, status_novo, motivo, criado_por
    )
    values (new.empresa_id, new.id, old.status, new.status, new.motivo_cancelamento, auth.uid());
  end if;

  return new;
end;
$$;

revoke execute on function public.pedidos_registrar_status_historico() from public, anon, authenticated;

create trigger pedidos_after_change_historico
  after insert or update on public.pedidos
  for each row execute function public.pedidos_registrar_status_historico();

create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  ficha_tecnica_id uuid not null references public.fichas_tecnicas (id) on delete restrict,
  quantidade numeric(12, 4) not null check (quantidade > 0),
  -- Snapshot imutável (mesmo princípio de vendas.custo_unitario_snapshot,
  -- 0027) — sempre gravado pela trigger abaixo, nunca aceito do cliente.
  preco_unitario_praticado numeric(14, 2) not null default 0,
  custo_unitario_snapshot numeric(14, 4) not null default 0,
  desconto_valor numeric(14, 2) not null default 0 check (desconto_valor >= 0),
  observacao text,
  valor_total numeric(14, 2) generated always as (quantidade * preco_unitario_praticado - desconto_valor) stored,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id, ordem);
create index pedido_itens_ficha_idx on public.pedido_itens (ficha_tecnica_id);

alter table public.pedido_itens enable row level security;

-- CRUD completo (incl. DELETE): mesmo motivo de fichas_tecnicas_itens
-- (0009) — o histórico de status do pedido já é a auditoria relevante,
-- itens podem ser ajustados livremente enquanto o pedido está em rascunho.
create policy "pedido_itens_all_own" on public.pedido_itens
  for all using (
    empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  )
  with check (
    empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );

-- Mesmo princípio de vendas.custo_unitario_snapshot (0027): só o CUSTO é
-- forçado pela trigger (nunca confiado ao cliente — é o que sustenta CMV/
-- margem). O preço praticado fica editável pelo cliente (Server Action),
-- com o preço da ficha técnica como valor inicial sugerido pela UI, para
-- permitir promoções/ajustes pontuais no PDV sem exigir editar a ficha.
create function public.pedido_itens_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select custo_por_porcao into new.custo_unitario_snapshot
  from public.fichas_tecnicas
  where id = new.ficha_tecnica_id;

  return new;
end;
$$;

revoke execute on function public.pedido_itens_snapshot() from public, anon, authenticated;

create trigger pedido_itens_before_insert_snapshot
  before insert on public.pedido_itens
  for each row execute function public.pedido_itens_snapshot();

create table public.pedido_item_adicionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_item_id uuid not null references public.pedido_itens (id) on delete cascade,
  ficha_tecnica_id uuid not null references public.fichas_tecnicas (id) on delete restrict,
  quantidade numeric(12, 4) not null check (quantidade > 0),
  preco_unitario_praticado numeric(14, 2) not null default 0,
  custo_unitario_snapshot numeric(14, 4) not null default 0,
  valor_total numeric(14, 2) generated always as (quantidade * preco_unitario_praticado) stored,
  criado_em timestamptz not null default now()
);

create index pedido_item_adicionais_item_idx on public.pedido_item_adicionais (pedido_item_id);

alter table public.pedido_item_adicionais enable row level security;

create policy "pedido_item_adicionais_all_own" on public.pedido_item_adicionais
  for all using (
    empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  )
  with check (
    empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );

create function public.pedido_item_adicionais_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select custo_por_porcao into new.custo_unitario_snapshot
  from public.fichas_tecnicas
  where id = new.ficha_tecnica_id;

  return new;
end;
$$;

revoke execute on function public.pedido_item_adicionais_snapshot() from public, anon, authenticated;

create trigger pedido_item_adicionais_before_insert_snapshot
  before insert on public.pedido_item_adicionais
  for each row execute function public.pedido_item_adicionais_snapshot();

-- Recalcula o subtotal do pedido pai a partir de itens + adicionais, mesmo
-- padrão idempotente de recalcular_ficha_tecnica (0009): sempre reconta a
-- soma atual, nunca incrementa/decrementa.
-- Sem revoke de execute (mesmo padrão de recalcular_ficha_tecnica, 0009):
-- chamada via `perform` pelas triggers INVOKER abaixo, precisa continuar
-- executável por authenticated. A escrita em pedidos já é coberta por
-- pedidos_update_own (o usuário só recalcula subtotal de pedidos da própria
-- empresa, mesma checagem que já vale para o INSERT/UPDATE/DELETE em
-- pedido_itens que disparou o recálculo).
create function public.recalcular_subtotal_pedido(p_pedido_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_subtotal numeric(14, 2);
begin
  select coalesce(sum(pi.valor_total), 0) + coalesce((
    select sum(pia.valor_total)
    from public.pedido_item_adicionais pia
    join public.pedido_itens pi2 on pi2.id = pia.pedido_item_id
    where pi2.pedido_id = p_pedido_id
  ), 0)
  into v_subtotal
  from public.pedido_itens pi
  where pi.pedido_id = p_pedido_id;

  update public.pedidos set subtotal = v_subtotal where id = p_pedido_id;
end;
$$;

create function public.pedido_itens_after_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_subtotal_pedido(old.pedido_id);
    return old;
  end if;

  perform public.recalcular_subtotal_pedido(new.pedido_id);
  return new;
end;
$$;

revoke execute on function public.pedido_itens_after_change() from public, anon, authenticated;

create trigger pedido_itens_after_change_recalcular
  after insert or update or delete on public.pedido_itens
  for each row execute function public.pedido_itens_after_change();

create function public.pedido_item_adicionais_after_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pedido_id uuid;
begin
  select pedido_id into v_pedido_id from public.pedido_itens
  where id = coalesce(new.pedido_item_id, old.pedido_item_id);

  perform public.recalcular_subtotal_pedido(v_pedido_id);
  return coalesce(new, old);
end;
$$;

revoke execute on function public.pedido_item_adicionais_after_change() from public, anon, authenticated;

create trigger pedido_item_adicionais_after_change_recalcular
  after insert or update or delete on public.pedido_item_adicionais
  for each row execute function public.pedido_item_adicionais_after_change();
