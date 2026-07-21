-- Publica pedido_itens no Realtime para o KDS atualizar status_preparo por praça.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pedido_itens'
  ) then
    alter publication supabase_realtime add table public.pedido_itens;
  end if;
end $$;
