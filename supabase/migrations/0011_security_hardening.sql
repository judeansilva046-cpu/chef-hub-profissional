-- Corrige os alertas do linter de segurança do Supabase (get_advisors) sobre
-- o schema aplicado em 0001-0010.

-- 1) search_path mutável: toda função do schema public deve fixar
--    search_path, mesmo as que não são SECURITY DEFINER, para não depender
--    do search_path de quem a invoca (proteção contra shadowing malicioso de
--    objetos com o mesmo nome em outro schema).
alter function public.set_updated_at() set search_path = public;
alter function public.calcular_campos_derivados_ficha_tecnica() set search_path = public;
alter function public.definir_custo_unitario_item_ficha() set search_path = public;
alter function public.recalcular_ficha_tecnica(uuid) set search_path = public;
alter function public.fichas_tecnicas_itens_recalcular() set search_path = public;

-- 2) Funções de trigger nunca devem ser chamáveis via RPC (PostgREST expõe
--    toda função do schema public por padrão). Elas só fazem sentido
--    invocadas pelo próprio Postgres em resposta a um INSERT/UPDATE; chamar
--    via RPC diretamente falha de qualquer forma (contexto de trigger
--    ausente), mas revogar deixa a superfície de API limpa e sem ruído no
--    linter.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.registrar_historico_preco_ingrediente() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.calcular_campos_derivados_ficha_tecnica() from public, anon, authenticated;
revoke execute on function public.definir_custo_unitario_item_ficha() from public, anon, authenticated;
revoke execute on function public.fichas_tecnicas_itens_recalcular() from public, anon, authenticated;

-- recalcular_ficha_tecnica(uuid) é chamada internamente pela trigger acima,
-- mas também é útil expor para manutenção futura (ex: recalcular em lote) —
-- ainda assim, restringe de anon (só authenticated).
revoke execute on function public.recalcular_ficha_tecnica(uuid) from public, anon;
grant execute on function public.recalcular_ficha_tecnica(uuid) to authenticated;

-- 3) salvar_ficha_tecnica e fn_duplicar_ficha_tecnica devem ser chamáveis
--    somente por usuários autenticados (nunca por "anon") — a checagem
--    manual de autorização dentro delas já protege contra IDOR, mas negar
--    a "anon" de saída é defesa em profundidade e remove o alerta do linter.
revoke execute on function public.salvar_ficha_tecnica(
  uuid, uuid, text, text, integer, numeric, uuid, numeric, numeric, jsonb, text
) from public, anon;

revoke execute on function public.fn_duplicar_ficha_tecnica(uuid) from public, anon;

-- Nota: a extensão pg_trgm permanece no schema public (o linter sugere
-- movê-la para um schema dedicado "extensions"). Decisão deliberada: é um
-- alerta de baixo risco (pg_trgm não expõe dados, só operadores de busca) e
-- movê-la depois de já existirem índices GIN dependentes dela adiciona risco
-- de complicar migrations futuras sem ganho de segurança real — documentado
-- aqui em vez de silenciado.
