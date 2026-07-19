-- Sprint 08: Cotação. Cada tabela carrega empresa_id diretamente (mesmo
-- padrão de pedido_itens, 0030) em vez de policy via EXISTS/join —
-- convenção mais recente do projeto, mais simples que o join usado em
-- solicitacoes_compra_itens (0017, anterior a esse padrão se firmar).
create table public.compras_cotacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  numero integer,
  solicitacao_origem_id uuid references public.solicitacoes_compra (id) on delete set null,
  status text not null default 'aberta' check (status in ('aberta', 'em_andamento', 'finalizada', 'cancelada')),
  fornecedor_vencedor_id uuid references public.fornecedores (id) on delete set null,
  escolha_automatica boolean not null default false,
  justificativa_escolha text,
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  finalizado_em timestamptz
);

create unique index compras_cotacoes_empresa_numero_key on public.compras_cotacoes (empresa_id, numero);
create index compras_cotacoes_empresa_status_idx on public.compras_cotacoes (empresa_id, status, criado_em desc);
create index compras_cotacoes_solicitacao_idx on public.compras_cotacoes (solicitacao_origem_id) where solicitacao_origem_id is not null;

alter table public.compras_cotacoes enable row level security;

create policy "compras_cotacoes_select_own" on public.compras_cotacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_cotacoes_insert_own" on public.compras_cotacoes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_cotacoes_update_own" on public.compras_cotacoes
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger compras_cotacoes_set_atualizado_em
  before update on public.compras_cotacoes
  for each row execute function public.set_atualizado_em();

create function public.compras_cotacoes_definir_numero()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.numero is null then
    new.numero := public.fn_proximo_numero_compras(new.empresa_id, 'cotacao');
  end if;
  return new;
end;
$$;

create trigger compras_cotacoes_before_insert_definir_numero
  before insert on public.compras_cotacoes
  for each row execute function public.compras_cotacoes_definir_numero();

-- Itens a cotar (quantidade desejada, independente de fornecedor).
create table public.compras_cotacoes_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cotacao_id uuid not null references public.compras_cotacoes (id) on delete cascade,
  ingrediente_id uuid not null references public.ingredientes (id) on delete restrict,
  quantidade numeric(14, 4) not null check (quantidade > 0)
);

create index compras_cotacoes_itens_cotacao_idx on public.compras_cotacoes_itens (cotacao_id);

alter table public.compras_cotacoes_itens enable row level security;

create policy "compras_cotacoes_itens_all_own" on public.compras_cotacoes_itens
  for all using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Fornecedores convidados para a cotação + as condições gerais da proposta
-- dele (prazo, pagamento, frete, impostos) — os PREÇOS por item ficam em
-- compras_cotacoes_propostas_itens (abaixo), porque cada item pode ter um
-- preço diferente do mesmo fornecedor.
create table public.compras_cotacoes_fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cotacao_id uuid not null references public.compras_cotacoes (id) on delete cascade,
  fornecedor_id uuid not null references public.fornecedores (id) on delete restrict,
  status text not null default 'convidado' check (status in ('convidado', 'respondido', 'vencedor', 'recusado')),
  prazo_entrega_dias integer check (prazo_entrega_dias is null or prazo_entrega_dias >= 0),
  condicao_pagamento text,
  valor_frete numeric(14, 2) not null default 0 check (valor_frete >= 0),
  valor_impostos numeric(14, 2) not null default 0 check (valor_impostos >= 0),
  pedido_minimo numeric(14, 2) check (pedido_minimo is null or pedido_minimo >= 0),
  observacao text,
  respondido_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (cotacao_id, fornecedor_id)
);

create index compras_cotacoes_fornecedores_cotacao_idx on public.compras_cotacoes_fornecedores (cotacao_id);
create index compras_cotacoes_fornecedores_fornecedor_idx on public.compras_cotacoes_fornecedores (fornecedor_id);

alter table public.compras_cotacoes_fornecedores enable row level security;

create policy "compras_cotacoes_fornecedores_all_own" on public.compras_cotacoes_fornecedores
  for all using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- O preço proposto por um fornecedor convidado, item a item — o "mapa
-- comparativo" é sempre montado em leitura (join destas 4 tabelas), nunca
-- persistido como uma tabela de resumo à parte.
create table public.compras_cotacoes_propostas_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cotacao_fornecedor_id uuid not null references public.compras_cotacoes_fornecedores (id) on delete cascade,
  cotacao_item_id uuid not null references public.compras_cotacoes_itens (id) on delete cascade,
  preco_unitario numeric(14, 4) not null check (preco_unitario >= 0),
  atende_pedido_minimo boolean not null default true,
  unique (cotacao_fornecedor_id, cotacao_item_id)
);

create index compras_cotacoes_propostas_itens_fornecedor_idx
  on public.compras_cotacoes_propostas_itens (cotacao_fornecedor_id);
create index compras_cotacoes_propostas_itens_item_idx
  on public.compras_cotacoes_propostas_itens (cotacao_item_id);

alter table public.compras_cotacoes_propostas_itens enable row level security;

create policy "compras_cotacoes_propostas_itens_all_own" on public.compras_cotacoes_propostas_itens
  for all using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
