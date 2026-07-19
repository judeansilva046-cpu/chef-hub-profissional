-- Sprint 07: Cupons. `crm_cupons` é CRUD normal (RLS por empresa, igual
-- fornecedores/clientes); `crm_cupons_usos` é o ledger de uso — cada resgate
-- de cupom é uma linha, nunca contada em coluna incremental no cupom (mesmo
-- motivo de vendas/contas serem sempre recontadas a partir das linhas
-- reais, não de um contador que pode dessincronizar).
-- "Campanhas automáticas" (que disparam cupons por gatilho) ficam na
-- migration 0050, junto de templates de mensagem — uma campanha sem
-- template para avisar o cliente não faz sentido isolada.
create table public.crm_cupons (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  codigo text not null,
  descricao text,
  tipo text not null check (tipo in ('percentual', 'fixo', 'frete_gratis', 'produto_gratis')),
  valor numeric(14, 2) not null default 0 check (valor >= 0),
  -- Só usado quando tipo='produto_gratis' — a ficha técnica concedida
  -- gratuitamente; reaproveita fichas_tecnicas (mesmo princípio de
  -- disponivel_como_adicional em pedidos, 0030) em vez de um catálogo de
  -- brindes separado.
  ficha_tecnica_gratis_id uuid references public.fichas_tecnicas (id) on delete set null,
  compra_minima numeric(14, 2) not null default 0 check (compra_minima >= 0),
  limite_uso_total integer check (limite_uso_total is null or limite_uso_total > 0),
  limite_uso_por_cliente integer not null default 1 check (limite_uso_por_cliente > 0),
  canal_venda_id uuid references public.canais_venda (id) on delete set null,
  -- Segmento permitido: compara contra clientes.segmento (rótulo manual já
  -- existente, 0026). Cupons restritos a um segmento CALCULADO (ex: "Alto
  -- ticket") não são validados no banco — ver risco documentado no relatório
  -- da sprint; a UI de campanhas filtra a lista de destinatários por
  -- segmento calculado antes de gerar os cupons individualmente quando
  -- necessário.
  segmento text,
  valido_de date,
  valido_ate date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index crm_cupons_empresa_codigo_key on public.crm_cupons (empresa_id, upper(codigo));
create index crm_cupons_empresa_ativo_idx on public.crm_cupons (empresa_id, ativo);

alter table public.crm_cupons enable row level security;

create policy "crm_cupons_select_own" on public.crm_cupons
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_cupons_insert_own" on public.crm_cupons
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_cupons_update_own" on public.crm_cupons
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_cupons_set_atualizado_em
  before update on public.crm_cupons
  for each row execute function public.set_atualizado_em();

create table public.crm_cupons_usos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cupom_id uuid not null references public.crm_cupons (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  valor_compra numeric(14, 2) not null,
  valor_desconto numeric(14, 2) not null,
  referencia_tipo text check (referencia_tipo in ('pedido', 'venda')),
  referencia_id uuid,
  criado_em timestamptz not null default now()
);

create index crm_cupons_usos_cupom_idx on public.crm_cupons_usos (cupom_id);
create index crm_cupons_usos_cliente_idx on public.crm_cupons_usos (cliente_id);
create index crm_cupons_usos_empresa_idx on public.crm_cupons_usos (empresa_id, criado_em desc);

alter table public.crm_cupons_usos enable row level security;

-- Sem policy de insert para authenticated: todo uso passa por
-- fn_validar_e_aplicar_cupom, que garante atomicamente que os limites são
-- respeitados (lock na linha do cupom evita corrida entre dois PDVs
-- aplicando o mesmo cupom no limite exato ao mesmo tempo).
create policy "crm_cupons_usos_select_own" on public.crm_cupons_usos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.fn_validar_e_aplicar_cupom(
  p_codigo text,
  p_cliente_id uuid,
  p_valor_compra numeric,
  p_canal_venda_id uuid default null,
  p_referencia_tipo text default null,
  p_referencia_id uuid default null
)
returns table (valor_desconto numeric, tipo text, ficha_tecnica_gratis_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid;
  v_cupom record;
  v_usos_totais integer;
  v_usos_cliente integer;
  v_desconto numeric(14, 2);
begin
  select c.empresa_id into v_empresa_id
  from public.clientes c
  where c.id = p_cliente_id
    and c.empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if v_empresa_id is null then
    raise exception 'Cliente não encontrado ou sem permissão.';
  end if;

  select * into v_cupom
  from public.crm_cupons
  where empresa_id = v_empresa_id and upper(codigo) = upper(p_codigo)
  for update;

  if v_cupom.id is null then
    raise exception 'Cupom inválido.';
  end if;

  if not v_cupom.ativo then
    raise exception 'Cupom inativo.';
  end if;

  if v_cupom.valido_de is not null and current_date < v_cupom.valido_de then
    raise exception 'Cupom ainda não está válido.';
  end if;

  if v_cupom.valido_ate is not null and current_date > v_cupom.valido_ate then
    raise exception 'Cupom expirado.';
  end if;

  if p_valor_compra < v_cupom.compra_minima then
    raise exception 'Valor da compra abaixo do mínimo exigido pelo cupom.';
  end if;

  if v_cupom.canal_venda_id is not null and v_cupom.canal_venda_id is distinct from p_canal_venda_id then
    raise exception 'Cupom não é válido para este canal de venda.';
  end if;

  select count(*) into v_usos_totais from public.crm_cupons_usos where cupom_id = v_cupom.id;
  if v_cupom.limite_uso_total is not null and v_usos_totais >= v_cupom.limite_uso_total then
    raise exception 'Cupom atingiu o limite total de usos.';
  end if;

  select count(*) into v_usos_cliente
  from public.crm_cupons_usos
  where cupom_id = v_cupom.id and cliente_id = p_cliente_id;
  if v_usos_cliente >= v_cupom.limite_uso_por_cliente then
    raise exception 'Cliente já atingiu o limite de uso deste cupom.';
  end if;

  v_desconto := case
    when v_cupom.tipo = 'percentual' then round(p_valor_compra * v_cupom.valor / 100, 2)
    when v_cupom.tipo = 'fixo' then least(v_cupom.valor, p_valor_compra)
    else 0
  end;

  insert into public.crm_cupons_usos (
    empresa_id, cupom_id, cliente_id, valor_compra, valor_desconto, referencia_tipo, referencia_id
  ) values (
    v_empresa_id, v_cupom.id, p_cliente_id, p_valor_compra, v_desconto, p_referencia_tipo, p_referencia_id
  );

  return query select v_desconto, v_cupom.tipo, v_cupom.ficha_tecnica_gratis_id;
end;
$$;

grant execute on function public.fn_validar_e_aplicar_cupom(text, uuid, numeric, uuid, text, uuid) to authenticated;
revoke execute on function public.fn_validar_e_aplicar_cupom(text, uuid, numeric, uuid, text, uuid) from public, anon;

-- Estorno = apagar o registro de uso (não um lançamento de sinal oposto,
-- diferente dos ledgers financeiros): "uso de cupom" é uma contagem de
-- controle, não um valor monetário próprio, então cancelar libera
-- corretamente a vaga do limite_uso_total/limite_uso_por_cliente.
create function public.fn_estornar_uso_cupom(p_uso_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.crm_cupons_usos
  where id = p_uso_id
    and empresa_id in (select id from public.empresas where usuario_id = auth.uid());

  if not found then
    raise exception 'Uso de cupom não encontrado ou sem permissão.';
  end if;
end;
$$;

grant execute on function public.fn_estornar_uso_cupom(uuid) to authenticated;
revoke execute on function public.fn_estornar_uso_cupom(uuid) from public, anon;
