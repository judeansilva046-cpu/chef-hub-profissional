-- Corrige os alertas de performance do linter do Supabase (get_advisors).

-- 1) Índices cobrindo foreign keys que não tinham (evita seq scan em
--    verificações de FK e nos joins mais comuns).
create index fichas_tecnicas_created_by_idx on public.fichas_tecnicas (created_by);
create index fichas_tecnicas_rendimento_unidade_id_idx on public.fichas_tecnicas (rendimento_unidade_id);
create index fichas_tecnicas_versoes_criado_por_idx on public.fichas_tecnicas_versoes (criado_por);
create index ingredientes_categoria_id_idx on public.ingredientes (categoria_id);
create index ingredientes_unidade_medida_id_idx on public.ingredientes (unidade_medida_id);
create index ingredientes_historico_precos_criado_por_idx on public.ingredientes_historico_precos (criado_por);

-- 2) auth.uid() dentro de uma policy é reavaliado LINHA A LINHA pelo
--    planejador; envolver em (select auth.uid()) permite ao Postgres tratar
--    como InitPlan (avaliado uma única vez por statement). Recomendação
--    oficial do linter de performance do Supabase — reescreve todas as
--    policies criadas em 0002-0010 com esse padrão.

alter policy "profiles_select_own" on public.profiles
  using (id = (select auth.uid()));
alter policy "profiles_update_own" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "empresas_select_own" on public.empresas
  using (usuario_id = (select auth.uid()));
alter policy "empresas_insert_own" on public.empresas
  with check (usuario_id = (select auth.uid()));
alter policy "empresas_update_own" on public.empresas
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

alter policy "unidades_medida_select" on public.unidades_medida
  using (
    empresa_id is null
    or empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
alter policy "unidades_medida_insert_own" on public.unidades_medida
  with check (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
alter policy "unidades_medida_update_own" on public.unidades_medida
  using (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  )
  with check (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
alter policy "unidades_medida_delete_own" on public.unidades_medida
  using (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );

alter policy "categorias_ingredientes_all_own" on public.categorias_ingredientes
  using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

alter policy "ingredientes_select_own" on public.ingredientes
  using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
alter policy "ingredientes_insert_own" on public.ingredientes
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
alter policy "ingredientes_update_own" on public.ingredientes
  using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

alter policy "ingredientes_historico_precos_select_own" on public.ingredientes_historico_precos
  using (
    exists (
      select 1
      from public.ingredientes i
      join public.empresas e on e.id = i.empresa_id
      where i.id = ingredientes_historico_precos.ingrediente_id
        and e.usuario_id = (select auth.uid())
    )
  );

alter policy "fichas_tecnicas_select_own" on public.fichas_tecnicas
  using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
alter policy "fichas_tecnicas_insert_own" on public.fichas_tecnicas
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
alter policy "fichas_tecnicas_update_own" on public.fichas_tecnicas
  using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

alter policy "fichas_tecnicas_itens_all_own" on public.fichas_tecnicas_itens
  using (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.empresas e on e.id = ft.empresa_id
      where ft.id = fichas_tecnicas_itens.ficha_tecnica_id
        and e.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.empresas e on e.id = ft.empresa_id
      where ft.id = fichas_tecnicas_itens.ficha_tecnica_id
        and e.usuario_id = (select auth.uid())
    )
  );

alter policy "fichas_tecnicas_versoes_select_own" on public.fichas_tecnicas_versoes
  using (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.empresas e on e.id = ft.empresa_id
      where ft.id = fichas_tecnicas_versoes.ficha_tecnica_id
        and e.usuario_id = (select auth.uid())
    )
  );

-- Nota: os avisos "unused_index" (INFO) são esperados — o banco é novo, sem
-- tráfego real ainda. "auth_db_connections_absolute" (INFO) é uma sugestão
-- de infraestrutura do Auth server, fora do escopo de migrations.
