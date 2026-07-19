-- Sprint 07: Comunicação e Campanhas. Este projeto não tem nenhuma
-- integração de envio real de WhatsApp/E-mail/SMS (confirmado: nenhuma
-- credencial/SDK de Twilio, WhatsApp Business API ou provedor de e-mail
-- existe em src/features/integracoes ou em variáveis de ambiente) — por
-- isso `crm_interacoes` é um REGISTRO (o que já existe em qualquer CRM
-- real: histórico de contato), não um disparador de mensagem. status_entrega
-- começa em 'pendente' para envios e é atualizado manualmente/pela
-- integração que vier a existir depois; ver risco documentado no relatório
-- da sprint.
create table public.crm_templates_mensagem (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  canal text not null check (canal in ('whatsapp', 'email', 'sms', 'interno')),
  assunto text,
  conteudo text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index crm_templates_mensagem_empresa_idx on public.crm_templates_mensagem (empresa_id, ativo);

alter table public.crm_templates_mensagem enable row level security;

create policy "crm_templates_mensagem_select_own" on public.crm_templates_mensagem
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_templates_mensagem_insert_own" on public.crm_templates_mensagem
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_templates_mensagem_update_own" on public.crm_templates_mensagem
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_templates_mensagem_delete_own" on public.crm_templates_mensagem
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_templates_mensagem_set_atualizado_em
  before update on public.crm_templates_mensagem
  for each row execute function public.set_atualizado_em();

create table public.crm_interacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  canal text not null check (canal in ('whatsapp', 'email', 'sms', 'interno', 'ligacao', 'presencial')),
  direcao text not null default 'enviado' check (direcao in ('enviado', 'recebido')),
  tipo text not null default 'mensagem' check (tipo in ('mensagem', 'nota', 'reclamacao')),
  assunto text,
  conteudo text,
  template_id uuid references public.crm_templates_mensagem (id) on delete set null,
  campanha_id uuid,
  status_entrega text not null default 'enviado' check (
    status_entrega in ('pendente', 'enviado', 'entregue', 'falhou', 'lido')
  ),
  -- Só relevante para tipo='reclamacao' — status próprio, para não misturar
  -- com status_entrega (que é sobre a mensagem em si, não sobre a resolução
  -- do problema relatado).
  reclamacao_resolvida boolean,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index crm_interacoes_cliente_idx on public.crm_interacoes (cliente_id, criado_em desc);
create index crm_interacoes_empresa_idx on public.crm_interacoes (empresa_id, criado_em desc);
create index crm_interacoes_reclamacoes_idx
  on public.crm_interacoes (empresa_id, reclamacao_resolvida)
  where tipo = 'reclamacao';

alter table public.crm_interacoes enable row level security;

create policy "crm_interacoes_select_own" on public.crm_interacoes
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_interacoes_insert_own" on public.crm_interacoes
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_interacoes_update_own" on public.crm_interacoes
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

-- Campanhas automáticas: definição do gatilho + template + cupom opcional.
-- Sem pg_cron neste projeto — o disparo é sob demanda, via Server Action
-- (dispararCampanha, src/features/comunicacao/actions.ts), que busca os
-- clientes elegíveis ao gatilho no momento do clique e grava uma
-- crm_interacao por cliente. Não há execução agendada automática nesta
-- sprint (risco documentado no relatório final).
create table public.crm_campanhas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  gatilho text not null check (gatilho in ('aniversario', 'inatividade', 'primeira_compra', 'manual')),
  dias_inatividade integer check (dias_inatividade is null or dias_inatividade > 0),
  cupom_id uuid references public.crm_cupons (id) on delete set null,
  template_id uuid references public.crm_templates_mensagem (id) on delete set null,
  ativo boolean not null default true,
  ultimo_disparo_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index crm_campanhas_empresa_idx on public.crm_campanhas (empresa_id, ativo);

alter table public.crm_campanhas enable row level security;

create policy "crm_campanhas_select_own" on public.crm_campanhas
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_campanhas_insert_own" on public.crm_campanhas
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_campanhas_update_own" on public.crm_campanhas
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "crm_campanhas_delete_own" on public.crm_campanhas
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger crm_campanhas_set_atualizado_em
  before update on public.crm_campanhas
  for each row execute function public.set_atualizado_em();

alter table public.crm_interacoes
  add constraint crm_interacoes_campanha_fk foreign key (campanha_id) references public.crm_campanhas (id) on delete set null;
create index crm_interacoes_campanha_idx on public.crm_interacoes (campanha_id) where campanha_id is not null;
