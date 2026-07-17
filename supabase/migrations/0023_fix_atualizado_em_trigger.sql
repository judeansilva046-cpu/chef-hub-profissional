-- Bug fix: set_updated_at() escreve em NEW.updated_at, mas solicitacoes_compra,
-- pedidos_compra e producoes_planejadas usam a coluna atualizado_em (padrão em
-- português do restante do schema da Sprint 02) — toda UPDATE nessas tabelas
-- falhava com "record \"new\" has no field \"updated_at\"". fornecedores usa
-- `updated_at` (padrão em inglês da Sprint 01) e continua com set_updated_at()
-- sem alteração.
create function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

revoke execute on function public.set_atualizado_em() from public, anon, authenticated;

drop trigger solicitacoes_compra_set_updated_at on public.solicitacoes_compra;
create trigger solicitacoes_compra_set_atualizado_em
  before update on public.solicitacoes_compra
  for each row execute function public.set_atualizado_em();

drop trigger pedidos_compra_set_updated_at on public.pedidos_compra;
create trigger pedidos_compra_set_atualizado_em
  before update on public.pedidos_compra
  for each row execute function public.set_atualizado_em();

drop trigger producoes_planejadas_set_updated_at on public.producoes_planejadas;
create trigger producoes_planejadas_set_atualizado_em
  before update on public.producoes_planejadas
  for each row execute function public.set_atualizado_em();
