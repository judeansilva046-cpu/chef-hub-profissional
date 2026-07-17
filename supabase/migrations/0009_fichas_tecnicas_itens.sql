create table public.fichas_tecnicas_itens (
  id uuid primary key default gen_random_uuid(),
  ficha_tecnica_id uuid not null references public.fichas_tecnicas (id) on delete cascade,
  -- on delete restrict: um ingrediente usado em alguma ficha não pode ser
  -- apagado (só inativado) — força integridade do histórico de fichas.
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  peso_bruto numeric(12, 4) not null check (peso_bruto > 0),
  percentual_perda numeric(5, 2) not null default 0 check (percentual_perda >= 0 and percentual_perda < 100),
  peso_liquido numeric(12, 4) generated always as (peso_bruto * (1 - percentual_perda / 100)) stored,
  -- Snapshot imutável do custo do ingrediente NO MOMENTO em que o item foi
  -- criado (nunca uma referência "viva" a ingredientes.custo_unitario_atual)
  -- — rastreabilidade histórica: o custo de uma ficha salva não muda
  -- silenciosamente quando o preço de um ingrediente é reajustado depois.
  -- Sempre sobrescrito pela trigger abaixo; nunca aceito do cliente.
  custo_unitario_utilizado numeric(14, 4) not null default 0,
  -- Custo é sobre o peso BRUTO (o que foi efetivamente comprado/pago) — a
  -- perda afeta o rendimento (peso_liquido), não o valor pago.
  custo_total_item numeric(14, 4) generated always as (peso_bruto * custo_unitario_utilizado) stored,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fichas_tecnicas_itens_ficha_ordem_idx on public.fichas_tecnicas_itens (ficha_tecnica_id, ordem);
create index fichas_tecnicas_itens_ingrediente_idx on public.fichas_tecnicas_itens (ingrediente_id);

alter table public.fichas_tecnicas_itens enable row level security;

-- CRUD completo (incl. DELETE) liberado: itens não têm trilha de auditoria
-- própria — o snapshot de cada versão da ficha (0010) já é a auditoria.
create policy "fichas_tecnicas_itens_all_own" on public.fichas_tecnicas_itens
  for all using (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.empresas e on e.id = ft.empresa_id
      where ft.id = fichas_tecnicas_itens.ficha_tecnica_id
        and e.usuario_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.empresas e on e.id = ft.empresa_id
      where ft.id = fichas_tecnicas_itens.ficha_tecnica_id
        and e.usuario_id = auth.uid()
    )
  );

create function public.definir_custo_unitario_item_ficha()
returns trigger
language plpgsql
as $$
begin
  select custo_unitario_atual into new.custo_unitario_utilizado
  from public.ingredientes where id = new.ingrediente_id;
  return new;
end;
$$;

create trigger fichas_tecnicas_itens_definir_custo
  before insert on public.fichas_tecnicas_itens
  for each row execute function public.definir_custo_unitario_item_ficha();

create trigger fichas_tecnicas_itens_set_updated_at
  before update on public.fichas_tecnicas_itens
  for each row execute function public.set_updated_at();

-- Recalcula os agregados da ficha pai sempre que um item muda — garante
-- corretude independente do caminho de escrita (Server Action hoje,
-- importação em lote ou integração amanhã). Idempotente: sempre reconta a
-- SOMA de todos os itens atuais, nunca incrementa/decrementa.
create function public.recalcular_ficha_tecnica(p_ficha_id uuid)
returns void
language plpgsql
as $$
declare
  v_peso_bruto_total numeric(12, 4);
  v_peso_liquido_total numeric(12, 4);
  v_custo_total numeric(14, 4);
begin
  select
    coalesce(sum(peso_bruto), 0),
    coalesce(sum(peso_liquido), 0),
    coalesce(sum(custo_total_item), 0)
  into v_peso_bruto_total, v_peso_liquido_total, v_custo_total
  from public.fichas_tecnicas_itens
  where ficha_tecnica_id = p_ficha_id;

  update public.fichas_tecnicas
  set
    peso_bruto_total = v_peso_bruto_total,
    peso_liquido_total = v_peso_liquido_total,
    custo_total = v_custo_total
  where id = p_ficha_id;
end;
$$;

create function public.fichas_tecnicas_itens_recalcular()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_ficha_tecnica(old.ficha_tecnica_id);
    return old;
  end if;

  perform public.recalcular_ficha_tecnica(new.ficha_tecnica_id);

  if tg_op = 'UPDATE' and old.ficha_tecnica_id is distinct from new.ficha_tecnica_id then
    perform public.recalcular_ficha_tecnica(old.ficha_tecnica_id);
  end if;

  return new;
end;
$$;

create trigger fichas_tecnicas_itens_after_change
  after insert or update or delete on public.fichas_tecnicas_itens
  for each row execute function public.fichas_tecnicas_itens_recalcular();
