-- Sprint 03 (continuação): canais de venda com taxa configurável (iFood,
-- 99Food, Keeta, Delivery Próprio, e canais personalizados). Mesmo padrão de
-- custos_variaveis (migration 0024): CRUD simples, sem RPC, sem efeito
-- colateral em outra tabela — a diferença é que aqui cada linha representa um
-- CANAL nomeado (para comparar preço/margem por canal na Precificação e no
-- Simulador de Promoções), enquanto custos_variaveis representa custos da
-- venda que não variam por canal (taxa de cartão, embalagem). Reaproveita
-- set_atualizado_em() (migration 0023).
create table public.canais_venda (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null default 'personalizado' check (
    tipo in ('ifood', '99food', 'keeta', 'proprio', 'personalizado')
  ),
  nome text not null,
  -- Percentual retido pelo canal sobre o preço de venda (comissão de
  -- marketplace) + valor fixo por venda (ex: taxa de entrega fixa). Mesma
  -- forma de custos_variaveis, mas os dois nunca se confundem: um custo
  -- variável geral (cartão, embalagem) incide em QUALQUER canal; a taxa de
  -- canal só incide quando aquela venda específica passou por aquele canal.
  taxa_percentual numeric(5, 2) not null default 0 check (
    taxa_percentual >= 0 and taxa_percentual <= 100
  ),
  taxa_fixa numeric(14, 2) not null default 0 check (taxa_fixa >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Evita duplicar iFood/99Food/Keeta/Delivery Próprio na mesma empresa; não
-- restringe 'personalizado', onde múltiplos canais nomeados livremente fazem
-- sentido (ex: "Balcão", "WhatsApp").
create unique index canais_venda_empresa_tipo_key
  on public.canais_venda (empresa_id, tipo)
  where tipo <> 'personalizado';

create index canais_venda_empresa_ativo_idx on public.canais_venda (empresa_id, ativo);

alter table public.canais_venda enable row level security;

create policy "canais_venda_select_own" on public.canais_venda
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "canais_venda_insert_own" on public.canais_venda
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "canais_venda_update_own" on public.canais_venda
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "canais_venda_delete_own" on public.canais_venda
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger canais_venda_set_atualizado_em
  before update on public.canais_venda
  for each row execute function public.set_atualizado_em();

-- Seed dos 4 canais padrão (taxa 0, o usuário configura depois) para toda
-- empresa já existente. Novas empresas recebem o mesmo seed em
-- src/features/empresa/actions.ts (criarEmpresa), fora desta migration.
insert into public.canais_venda (empresa_id, tipo, nome)
select empresas.id, padrao.tipo, padrao.nome
from public.empresas
cross join (
  values
    ('ifood', 'iFood'),
    ('99food', '99Food'),
    ('keeta', 'Keeta'),
    ('proprio', 'Delivery Próprio')
) as padrao (tipo, nome);
