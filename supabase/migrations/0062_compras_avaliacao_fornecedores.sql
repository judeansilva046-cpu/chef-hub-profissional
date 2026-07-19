-- Sprint 08: Avaliação de fornecedores. Notas manuais (1-5) por pedido +
-- métricas objetivas calculadas (taxa de entrega completa) — nunca
-- persistidas, sempre agregadas em view a partir de dados que já existem
-- (avaliações + recebimentos), mesmo princípio de crm_clientes_metricas
-- (Sprint 07).
create table public.compras_avaliacoes_fornecedor (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  fornecedor_id uuid not null references public.fornecedores (id) on delete cascade,
  pedido_id uuid references public.pedidos_compra (id) on delete set null,
  pontualidade smallint not null check (pontualidade between 1 and 5),
  qualidade smallint not null check (qualidade between 1 and 5),
  preco smallint not null check (preco between 1 and 5),
  atendimento smallint not null check (atendimento between 1 and 5),
  comentario text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index compras_avaliacoes_fornecedor_fornecedor_idx
  on public.compras_avaliacoes_fornecedor (fornecedor_id, criado_em desc);
create index compras_avaliacoes_fornecedor_pedido_idx
  on public.compras_avaliacoes_fornecedor (pedido_id) where pedido_id is not null;

alter table public.compras_avaliacoes_fornecedor enable row level security;

-- Sem UPDATE/DELETE: avaliação é um registro histórico do que se pensou
-- naquele momento (mesmo espírito de auditoria) — uma nota errada se
-- corrige com uma nova avaliação, não editando a antiga.
create policy "compras_avaliacoes_fornecedor_select_own" on public.compras_avaliacoes_fornecedor
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_avaliacoes_fornecedor_insert_own" on public.compras_avaliacoes_fornecedor
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- security_invoker: a view roda com a RLS de quem consulta, não do dono da
-- view (mesmo motivo de crm_clientes_metricas, Sprint 07).
create view public.compras_fornecedores_score
with (security_invoker = true) as
with avaliacoes_agregadas as (
  select
    fornecedor_id,
    avg(pontualidade)::numeric(3, 2) as pontualidade_media,
    avg(qualidade)::numeric(3, 2) as qualidade_media,
    avg(preco)::numeric(3, 2) as preco_media,
    avg(atendimento)::numeric(3, 2) as atendimento_media,
    avg((pontualidade + qualidade + preco + atendimento) / 4.0)::numeric(3, 2) as score_geral,
    count(*) as total_avaliacoes
  from public.compras_avaliacoes_fornecedor
  group by fornecedor_id
),
pedidos_divergencia as (
  select
    pc.id as pedido_id,
    pc.fornecedor_id,
    exists (
      select 1
      from public.compras_recebimentos_itens ri
      join public.pedidos_compra_itens pi on pi.id = ri.pedido_item_id
      where pi.pedido_id = pc.id and ri.divergencia
    ) as teve_divergencia
  from public.pedidos_compra pc
  where pc.status = 'recebido'
),
entrega_agregada as (
  select
    fornecedor_id,
    count(*) as total_pedidos_recebidos,
    round(100.0 * count(*) filter (where not teve_divergencia) / count(*), 1) as taxa_entrega_completa
  from pedidos_divergencia
  group by fornecedor_id
)
select
  f.id as fornecedor_id,
  f.empresa_id,
  f.nome,
  coalesce(av.pontualidade_media, 0) as pontualidade_media,
  coalesce(av.qualidade_media, 0) as qualidade_media,
  coalesce(av.preco_media, 0) as preco_media,
  coalesce(av.atendimento_media, 0) as atendimento_media,
  coalesce(av.score_geral, 0) as score_geral,
  coalesce(av.total_avaliacoes, 0) as total_avaliacoes,
  coalesce(eg.total_pedidos_recebidos, 0) as total_pedidos_recebidos,
  eg.taxa_entrega_completa
from public.fornecedores f
left join avaliacoes_agregadas av on av.fornecedor_id = f.id
left join entrega_agregada eg on eg.fornecedor_id = f.id;
