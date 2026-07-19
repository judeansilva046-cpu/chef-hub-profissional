-- Sprint 08: "Produtos por fornecedor" — estende fornecedor_ingredientes
-- (0016), não recria. `preco_unitario` continua sendo o preço ATUAL (já
-- existia); `preco_anterior` é novo, mantido por trigger a cada mudança,
-- para a UI mostrar a variação sem precisar consultar o histórico. O
-- histórico completo (para gráfico/relatório de variação de preço) vive em
-- `fornecedor_ingredientes_historico_precos`, mesmo padrão de
-- ingredientes_historico_precos (0007) — trigger-only, sem policy de INSERT
-- para authenticated.
alter table public.fornecedor_ingredientes
  add column codigo_fornecedor text,
  add column unidade_compra_id uuid references public.unidades_medida (id) on delete set null,
  -- Quantas unidades de estoque equivalem a 1 unidade de compra (ex: compra
  -- uma "caixa" com fator 12 quando a ficha técnica usa "unidade"). Este
  -- projeto não tem motor de conversão entre unidades (limitação já
  -- documentada em unidades_medida, 0004) — este fator é só ESTE número
  -- fixo por fornecedor/ingrediente, não um motor geral.
  add column fator_conversao numeric(14, 6) not null default 1 check (fator_conversao > 0),
  add column marca text,
  add column embalagem text,
  add column quantidade_embalagem numeric(14, 4) not null default 1 check (quantidade_embalagem > 0),
  add column preco_anterior numeric(14, 4),
  add column prazo_entrega_dias integer check (prazo_entrega_dias is null or prazo_entrega_dias >= 0),
  add column pedido_minimo numeric(14, 2) check (pedido_minimo is null or pedido_minimo >= 0),
  add column preferencial boolean not null default false;

-- Só um fornecedor preferencial por ingrediente/empresa.
create unique index fornecedor_ingredientes_preferencial_key
  on public.fornecedor_ingredientes (empresa_id, ingrediente_id)
  where preferencial;

create table public.fornecedor_ingredientes_historico_precos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_ingrediente_id uuid not null references public.fornecedor_ingredientes (id) on delete cascade,
  preco_unitario numeric(14, 4) not null check (preco_unitario >= 0),
  data_referencia timestamptz not null default now(),
  criado_por uuid references public.profiles (id)
);

create index fornecedor_ingredientes_historico_fi_idx
  on public.fornecedor_ingredientes_historico_precos (fornecedor_ingrediente_id, data_referencia desc);

alter table public.fornecedor_ingredientes_historico_precos enable row level security;

create policy "fornecedor_ingredientes_historico_select_own" on public.fornecedor_ingredientes_historico_precos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create function public.fn_registrar_historico_preco_fornecedor_ingrediente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and old.preco_unitario is distinct from new.preco_unitario then
    new.preco_anterior := old.preco_unitario;
  end if;

  if TG_OP = 'INSERT' or old.preco_unitario is distinct from new.preco_unitario then
    insert into public.fornecedor_ingredientes_historico_precos (
      empresa_id, fornecedor_ingrediente_id, preco_unitario, criado_por
    ) values (
      new.empresa_id, new.id, new.preco_unitario, auth.uid()
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.fn_registrar_historico_preco_fornecedor_ingrediente() from public, anon, authenticated;

-- BEFORE (não AFTER, como ingredientes_historico_precos): aqui a trigger
-- também PRECISA escrever new.preco_anterior na própria linha, então tem
-- que rodar antes da gravação — o padrão de ingredientes_historico_precos
-- não precisava disso porque não existe coluna "valor anterior" lá.
create trigger fornecedor_ingredientes_before_upsert_historico
  before insert or update of preco_unitario on public.fornecedor_ingredientes
  for each row execute function public.fn_registrar_historico_preco_fornecedor_ingrediente();
