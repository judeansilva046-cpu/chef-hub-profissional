-- Planejamento de Produção. "Visão diária" e "visão semanal" pedidas no
-- produto são apenas agrupamentos por data_producao desta MESMA tabela —
-- não há necessidade de tabelas separadas para cada granularidade.
create table public.producoes_planejadas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  ficha_tecnica_id uuid not null references public.fichas_tecnicas (id) on delete restrict,
  data_producao date not null,
  quantidade_planejada numeric(12, 4) not null check (quantidade_planejada > 0),
  status text not null default 'planejada' check (
    status in ('planejada', 'em_producao', 'concluida', 'cancelada')
  ),
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index producoes_planejadas_empresa_data_idx
  on public.producoes_planejadas (empresa_id, data_producao);
create index producoes_planejadas_ficha_idx
  on public.producoes_planejadas (ficha_tecnica_id);

alter table public.producoes_planejadas enable row level security;

-- Sem DELETE: cancelar = status='cancelada' (mantém rastreabilidade do
-- planejamento mesmo quando não executado).
create policy "producoes_planejadas_select_own" on public.producoes_planejadas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "producoes_planejadas_insert_own" on public.producoes_planejadas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "producoes_planejadas_update_own" on public.producoes_planejadas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger producoes_planejadas_set_updated_at
  before update on public.producoes_planejadas
  for each row execute function public.set_updated_at();

-- Fecha o ciclo Ficha Técnica -> Planejamento -> Estoque: ao concluir uma
-- produção, consome do estoque (via FIFO, 0014) a quantidade de cada
-- ingrediente da ficha, proporcional a quantidade_planejada/rendimento.
-- Tudo dentro da mesma transação: se faltar estoque de qualquer
-- ingrediente, a função inteira falha e nada é consumido (fn_registrar_
-- saida_estoque já lança exceção, que propaga e reverte o que já rodou
-- neste loop).
create function public.fn_concluir_producao(p_producao_id uuid)
returns void
language plpgsql
as $$
declare
  v_producao public.producoes_planejadas%rowtype;
  v_ficha public.fichas_tecnicas%rowtype;
  v_fator numeric(14, 6);
  v_item record;
begin
  select * into v_producao from public.producoes_planejadas where id = p_producao_id;
  if not found then
    raise exception 'Produção planejada não encontrada';
  end if;
  if v_producao.status = 'concluida' then
    raise exception 'Esta produção já foi concluída';
  end if;

  select * into v_ficha from public.fichas_tecnicas where id = v_producao.ficha_tecnica_id;
  v_fator := v_producao.quantidade_planejada / v_ficha.rendimento_quantidade;

  for v_item in
    select ingrediente_id, peso_bruto
    from public.fichas_tecnicas_itens
    where ficha_tecnica_id = v_producao.ficha_tecnica_id
  loop
    perform public.fn_registrar_saida_estoque(
      v_item.ingrediente_id, v_item.peso_bruto * v_fator, 'saida',
      'producao', p_producao_id,
      'Consumo da produção de "' || v_ficha.nome || '"'
    );
  end loop;

  update public.producoes_planejadas
  set status = 'concluida'
  where id = p_producao_id;
end;
$$;

grant execute on function public.fn_concluir_producao(uuid) to authenticated;
