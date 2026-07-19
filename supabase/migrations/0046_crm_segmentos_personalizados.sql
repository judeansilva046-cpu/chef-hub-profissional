-- Sprint 07: Segmentação. Os segmentos "automáticos" do escopo (Novos,
-- Recorrentes, Inativos, VIP, Alto ticket, Baixa frequência, Aniversariantes,
-- Risco de abandono, por produto/canal) NÃO são tabelas — são sempre
-- calculados em consulta a partir de crm_clientes_metricas (0045) + vendas,
-- mesmo princípio de "não duplicar o que já é derivável" já estabelecido
-- para clientes. Esta tabela guarda só os segmentos PERSONALIZADOS: a
-- DEFINIÇÃO do filtro (critérios), não a lista de membros — a lista também é
-- sempre recalculada em leitura, para nunca ficar dessincronizada dos dados
-- reais.
create table public.crm_segmentos_personalizados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  descricao text,
  -- Formato interpretado por avaliarSegmentoPersonalizado
  -- (src/features/crm-segmentacao/calculations.ts): campos opcionais como
  -- gastoMinimo, gastoMaximo, ticketMedioMinimo, frequenciaMinima,
  -- diasSemComprarMinimo, tags, origem. jsonb (não colunas fixas) porque o
  -- conjunto de critérios é o tipo de coisa que só cresce com o tempo, e
  -- cada empresa usa um subconjunto diferente.
  criterios jsonb not null default '{}',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index crm_segmentos_personalizados_empresa_ativo_idx
  on public.crm_segmentos_personalizados (empresa_id, ativo);

alter table public.crm_segmentos_personalizados enable row level security;

create policy "crm_segmentos_personalizados_select_own" on public.crm_segmentos_personalizados
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_segmentos_personalizados_insert_own" on public.crm_segmentos_personalizados
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_segmentos_personalizados_update_own" on public.crm_segmentos_personalizados
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_segmentos_personalizados_delete_own" on public.crm_segmentos_personalizados
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_segmentos_personalizados_set_atualizado_em
  before update on public.crm_segmentos_personalizados
  for each row execute function public.set_atualizado_em();
