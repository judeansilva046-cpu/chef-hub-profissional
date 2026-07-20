-- Cleanup pré-Sprint 09: prepara o terreno para quando uma integração real
-- (iFood/99Food/Keeta/Open Delivery) tiver credencial de parceiro
-- homologado — sem isso ainda não existe nenhuma chamada real (ver
-- docs/DATABASE.md, Sprint 04), mas as 3 lacunas abaixo bloqueariam a
-- ingestão de pedido por webhook mesmo depois da credencial chegar, então
-- resolvidas agora enquanto o schema ainda está pequeno.

-- 1) pedidos: rastreabilidade e idempotência de pedido vindo de fora. Um
-- pedido "interno" (balcão/PDV) continua com os dois campos nulos — só
-- pedidos criados a partir de um webhook de integração os preenchem.
alter table public.pedidos
  add column id_externo text,
  add column provedor_origem text check (
    provedor_origem is null or provedor_origem in ('ifood', '99food', 'keeta', 'open_delivery')
  );

-- Reprocessar o mesmo webhook (reentrega, retry do provedor) nunca duplica
-- o pedido — mesmo princípio de UNIQUE(fornecedor_id, ingrediente_id) em
-- fornecedor_ingredientes: o par (provedor, id_externo) da própria
-- plataforma já é a chave natural, dentro de uma empresa.
create unique index pedidos_empresa_provedor_id_externo_key
  on public.pedidos (empresa_id, provedor_origem, id_externo)
  where id_externo is not null;

-- 2) integracoes_canais: liga a CONEXÃO (integracoes_canais) ao canal de
-- venda que já carrega a TAXA daquele provedor (canais_venda, 0025) — hoje
-- as duas tabelas só coincidem por terem o mesmo texto em provedor/tipo,
-- sem FK nenhuma. canal_venda_id é preenchido automaticamente ao conectar
-- (ver fn/action em src/features/integracoes/actions.ts), casando por tipo;
-- fica nulo se a empresa não tiver esse canal (nunca bloqueia o connect).
--
-- identificador_externo é o merchant/store ID daquela empresa NA plataforma
-- (ex: merchantId do iFood) — é o dado que falta hoje para o webhook
-- descobrir de qual empresa é um pedido recebido (ver fn_registrar_
-- webhook_integracao abaixo). Sem valor real de nenhum provedor ainda
-- (nenhuma credencial homologada existe), mas o campo já existe para
-- quando o usuário conectar de verdade.
alter table public.integracoes_canais
  add column canal_venda_id uuid references public.canais_venda (id) on delete set null,
  add column identificador_externo text;

create index integracoes_canais_provedor_identificador_idx
  on public.integracoes_canais (provedor, identificador_externo)
  where identificador_externo is not null;

-- 3) Resolução de empresa_id para o webhook — antes o INSERT em
-- integracoes_webhooks_recebidos saía sempre com empresa_id nulo (a única
-- policy da tabela é SELECT por empresa_id, então essas linhas eram
-- estruturalmente invisíveis para qualquer usuário). Chamada pela Route
-- Handler do webhook com o client service-role (que já bypassa RLS) — sem
-- revoke aqui, mesmo padrão de fn_emitir_etiqueta (0028): STABLE, só
-- devolve um uuid de lookup, sem dado sensível o bastante para justificar
-- restringir o caller e correr o risco de também bloquear o service-role
-- sem necessidade.
create function public.fn_resolver_empresa_webhook_integracao(p_provedor text, p_identificador_externo text)
returns uuid
language sql
stable
set search_path = public
as $$
  select empresa_id
  from public.integracoes_canais
  where provedor = p_provedor
    and identificador_externo = p_identificador_externo
  limit 1;
$$;
