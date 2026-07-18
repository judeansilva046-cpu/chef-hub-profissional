-- Sprint 04: preparação de integrações externas (iFood, 99Food, Keeta, Open
-- Delivery). Esta migration cria SÓ a estrutura (tabela de conexão, log de
-- sincronização, inbox de webhook) — nenhuma chamada real a API de provedor
-- existe nesta sprint (ver src/integrations/*), porque isso depende de
-- credenciais e homologação externas que o projeto ainda não tem.
--
-- Credenciais NÃO são criptografadas aqui dentro do Postgres (armazenar a
-- chave de criptografia numa migration SQL seria menos seguro, não mais —
-- qualquer um com acesso de leitura ao schema veria a chave). A criptografia
-- é feita na camada de aplicação (AES-256-GCM, chave em variável de ambiente
-- — ver src/features/integracoes/crypto.ts) antes de gravar; esta coluna só
-- guarda o texto cifrado (opaco para quem só tem acesso ao banco).
create table public.integracoes_canais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  provedor text not null check (provedor in ('ifood', '99food', 'keeta', 'open_delivery')),
  status_conexao text not null default 'nao_configurado' check (
    status_conexao in ('nao_configurado', 'pendente_homologacao', 'conectado', 'erro', 'desconectado')
  ),
  credenciais_criptografadas text,
  metadata jsonb not null default '{}'::jsonb,
  conectado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, provedor)
);

alter table public.integracoes_canais enable row level security;

create policy "integracoes_canais_select_own" on public.integracoes_canais
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "integracoes_canais_insert_own" on public.integracoes_canais
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "integracoes_canais_update_own" on public.integracoes_canais
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "integracoes_canais_delete_own" on public.integracoes_canais
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger integracoes_canais_set_atualizado_em
  before update on public.integracoes_canais
  for each row execute function public.set_atualizado_em();

-- Append-only (auditoria) — mesmo padrão de estoque_movimentacoes/
-- fichas_tecnicas_versoes: sem UPDATE/DELETE para authenticated.
create table public.integracoes_logs_sincronizacao (
  id uuid primary key default gen_random_uuid(),
  integracao_id uuid references public.integracoes_canais (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo_evento text not null,
  status text not null check (status in ('sucesso', 'erro')),
  mensagem text,
  payload_resumo jsonb,
  criado_em timestamptz not null default now()
);

create index integracoes_logs_empresa_criado_idx on public.integracoes_logs_sincronizacao (empresa_id, criado_em desc);

alter table public.integracoes_logs_sincronizacao enable row level security;

create policy "integracoes_logs_select_own" on public.integracoes_logs_sincronizacao
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "integracoes_logs_insert_own" on public.integracoes_logs_sincronizacao
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Inbox interno de webhooks recebidos dos provedores. Quem grava aqui é
-- SEMPRE a Route Handler /api/webhooks/[provedor] rodando com o client
-- service-role (o provedor externo não tem sessão Supabase Auth) — por isso
-- não existe policy de INSERT para `authenticated`, mesmo padrão de
-- ingredientes_historico_precos ("estruturalmente impossível gravar pela
-- API normal").
create table public.integracoes_webhooks_recebidos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas (id) on delete cascade,
  provedor text not null check (provedor in ('ifood', '99food', 'keeta', 'open_delivery')),
  payload jsonb not null,
  assinatura_valida boolean not null default false,
  processado boolean not null default false,
  erro_mensagem text,
  criado_em timestamptz not null default now()
);

create index integracoes_webhooks_empresa_criado_idx on public.integracoes_webhooks_recebidos (empresa_id, criado_em desc);

alter table public.integracoes_webhooks_recebidos enable row level security;

create policy "integracoes_webhooks_select_own" on public.integracoes_webhooks_recebidos
  for select using (
    empresa_id is not null
    and empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
