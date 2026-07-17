-- Inventário (contagem física): registra a quantidade que o sistema
-- acreditava existir (snapshot no momento em que o item é adicionado à
-- contagem) ao lado da quantidade realmente contada. Ao concluir, gera
-- ajustes de estoque automaticamente para cada diferença.

create table public.estoque_inventarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluido')),
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  concluido_em timestamptz
);

create index estoque_inventarios_empresa_idx on public.estoque_inventarios (empresa_id, criado_em desc);

alter table public.estoque_inventarios enable row level security;

create policy "estoque_inventarios_select_own" on public.estoque_inventarios
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "estoque_inventarios_insert_own" on public.estoque_inventarios
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "estoque_inventarios_update_own" on public.estoque_inventarios
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create table public.estoque_inventario_itens (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references public.estoque_inventarios (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  quantidade_sistema numeric(14, 4) not null default 0,
  quantidade_contada numeric(14, 4),
  unique (inventario_id, ingrediente_id)
);

alter table public.estoque_inventario_itens enable row level security;

create policy "estoque_inventario_itens_all_own" on public.estoque_inventario_itens
  for all using (
    exists (
      select 1 from public.estoque_inventarios inv
      join public.empresas e on e.id = inv.empresa_id
      where inv.id = estoque_inventario_itens.inventario_id
        and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.estoque_inventarios inv
      join public.empresas e on e.id = inv.empresa_id
      where inv.id = estoque_inventario_itens.inventario_id
        and e.usuario_id = (select auth.uid())
    )
  );

-- Conclui o inventário: para cada item contado (quantidade_contada não
-- nula) cuja diferença para o saldo do sistema seja diferente de zero,
-- gera uma entrada (sobra) ou saída (falta) tipo 'inventario' via as
-- funções únicas de escrita de estoque (0014) — nunca mexe em
-- estoque_lotes/estoque_saldos diretamente.
create function public.fn_concluir_inventario(p_inventario_id uuid)
returns void
language plpgsql
as $$
declare
  v_item record;
  v_diferenca numeric(14, 4);
  v_custo_medio numeric(14, 4);
begin
  for v_item in
    select * from public.estoque_inventario_itens
    where inventario_id = p_inventario_id and quantidade_contada is not null
  loop
    v_diferenca := v_item.quantidade_contada - v_item.quantidade_sistema;

    if v_diferenca > 0 then
      select coalesce(custo_medio_ponderado, 0) into v_custo_medio
      from public.estoque_saldos
      where ingrediente_id = v_item.ingrediente_id;

      perform public.fn_registrar_entrada_estoque(
        v_item.ingrediente_id, v_diferenca, coalesce(v_custo_medio, 0),
        null, null, 'inventario', p_inventario_id, 'Ajuste de inventário (sobra)'
      );
    elsif v_diferenca < 0 then
      perform public.fn_registrar_saida_estoque(
        v_item.ingrediente_id, abs(v_diferenca), 'inventario',
        'inventario', p_inventario_id, 'Ajuste de inventário (falta)'
      );
    end if;
  end loop;

  update public.estoque_inventarios
  set status = 'concluido', concluido_em = now()
  where id = p_inventario_id;
end;
$$;

grant execute on function public.fn_concluir_inventario(uuid) to authenticated;
