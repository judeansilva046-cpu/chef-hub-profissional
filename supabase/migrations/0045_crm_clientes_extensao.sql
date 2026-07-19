-- Sprint 07: CRM e Fidelização. Esta migration só ESTENDE public.clientes
-- (0026) com os campos que o CRM precisa e que não existiam ainda — não
-- recria a tabela, não duplica nome/telefone/e-mail/documento/endereco/
-- segmento/preferencias/observacoes/ativo, que já existem desde a Sprint 04.
alter table public.clientes
  add column whatsapp text,
  add column data_nascimento date,
  add column restricoes_alimentares text,
  -- Tags livres (ex: "alergia a amendoim", "cliente corporativo") — além do
  -- campo `segmento` (rótulo único já existente), um cliente pode ter várias
  -- tags simultâneas.
  add column tags text[] not null default '{}',
  add column origem text,
  -- Preferências de comunicação por canal (item 7 do escopo) — opt-out
  -- específico, não um único "aceita contato" genérico, porque um cliente
  -- pode querer WhatsApp mas não e-mail.
  add column opt_in_whatsapp boolean not null default true,
  add column opt_in_email boolean not null default true,
  add column opt_in_sms boolean not null default true,
  -- Consentimento LGPD: só um booleano + carimbo de quando foi concedido.
  -- Revogação = ativo/opt-in booleanos voltando a false (mesmo padrão de
  -- soft-delete via `ativo` já usado nesta tabela); não modelamos aqui um
  -- histórico de termos de consentimento versionados, fora do escopo desta
  -- sprint.
  add column consentimento_lgpd boolean not null default false,
  add column consentimento_lgpd_em timestamptz;

create index clientes_tags_idx on public.clientes using gin (tags);
-- Aniversariantes do mês/dia, independente do ano de nascimento. extract()
-- em `date` (não `timestamptz`) é IMMUTABLE, diferente de to_char (STABLE,
-- rejeitado em índice).
create index clientes_aniversario_idx
  on public.clientes (empresa_id, extract(month from data_nascimento), extract(day from data_nascimento))
  where data_nascimento is not null;

-- Métricas por cliente (total gasto, ticket médio, frequência, última
-- compra) SEMPRE derivadas de `vendas` em tempo de leitura — mesmo princípio
-- já documentado em buscarEstatisticasCliente (src/features/clientes/
-- queries.ts): não duplicar em colunas de `clientes` o que já é calculável a
-- partir de `vendas`. Esta view centraliza esse cálculo (antes só existia em
-- TypeScript) para ser reaproveitada por Segmentação, Perfil 360 e Dashboard
-- CRM sem repetir a mesma agregação em três lugares.
-- security_invoker: a view roda com as permissões de RLS de quem a
-- consulta (não do dono da view) — sem isso, RLS de `clientes`/`vendas`
-- seria avaliada com o papel do criador da view, vazando dados entre
-- empresas.
create view public.crm_clientes_metricas
with (security_invoker = true) as
select
  c.id as cliente_id,
  c.empresa_id,
  coalesce(v.total_gasto, 0) as total_gasto,
  coalesce(v.quantidade_compras, 0)::integer as quantidade_compras,
  case
    when coalesce(v.quantidade_compras, 0) > 0 then v.total_gasto / v.quantidade_compras
    else 0
  end as ticket_medio,
  v.primeira_compra,
  v.ultima_compra,
  case
    when v.ultima_compra is not null then (current_date - v.ultima_compra)
    else null
  end as dias_desde_ultima_compra
from public.clientes c
left join (
  select
    cliente_id,
    sum(valor_total) as total_gasto,
    count(*) as quantidade_compras,
    min(data_venda) as primeira_compra,
    max(data_venda) as ultima_compra
  from public.vendas
  where cliente_id is not null
  group by cliente_id
) v on v.cliente_id = c.id;
