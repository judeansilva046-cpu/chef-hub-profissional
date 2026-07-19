-- Sprint 08: Compras, Fornecedores e Cotação Inteligente. Esta migration só
-- ESTENDE public.fornecedores (0016) — não recria a tabela. `nome` (já
-- obrigatório, já usado no índice único e em todo join existente) passa a
-- documentar-se como a razão social; `nome_fantasia` é o campo novo,
-- opcional, para quando o fornecedor usa um nome comercial diferente —
-- evita quebrar qualquer tela/consulta que já depende de `nome`.
alter table public.fornecedores
  add column nome_fantasia text,
  add column inscricao_estadual text,
  add column whatsapp text,
  add column contato_nome text,
  -- Categorias livres (ex: "hortifruti", "embalagens") — mesmo padrão de
  -- clientes.tags (0045).
  add column categorias text[] not null default '{}',
  add column condicoes_pagamento text,
  add column prazo_medio_entrega_dias integer check (prazo_medio_entrega_dias is null or prazo_medio_entrega_dias >= 0),
  add column pedido_minimo numeric(14, 2) check (pedido_minimo is null or pedido_minimo >= 0),
  -- jsonb (não colunas fixas) porque é um blob pequeno só para exibição/
  -- referência na hora de pagar — nunca usado em filtro/JOIN, então não
  -- precisa de colunas próprias nem índice.
  add column dados_bancarios jsonb,
  add column chave_pix text;

create index fornecedores_categorias_idx on public.fornecedores using gin (categorias);

-- Anexos genéricos (documentos de fornecedor, comprovantes de solicitação,
-- fotos de recebimento) — um único mecanismo polimórfico-leve (mesmo padrão
-- de estoque_movimentacoes, 0013) em vez de uma tabela por entidade. Este
-- projeto não integra um serviço de armazenamento de arquivos (nenhum uso de
-- Supabase Storage em nenhuma sprint anterior) — `url` é sempre um link
-- colado pelo usuário (ex: Drive/Dropbox), não upload real; mesma limitação
-- já documentada para integrações externas (0029).
create table public.compras_anexos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  referencia_tipo text not null check (
    referencia_tipo in ('fornecedor', 'solicitacao_compra', 'pedido_compra', 'recebimento')
  ),
  referencia_id uuid not null,
  nome_arquivo text not null,
  url text not null,
  tipo text not null default 'outro' check (
    tipo in ('contrato', 'alvara', 'certidao', 'nota_fiscal', 'foto', 'outro')
  ),
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index compras_anexos_referencia_idx on public.compras_anexos (referencia_tipo, referencia_id);
create index compras_anexos_empresa_idx on public.compras_anexos (empresa_id, criado_em desc);

alter table public.compras_anexos enable row level security;

create policy "compras_anexos_select_own" on public.compras_anexos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_anexos_insert_own" on public.compras_anexos
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_anexos_delete_own" on public.compras_anexos
  for delete using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
