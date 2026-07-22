# Sprint 18 — Homologação das Integrações Reais

## Objetivo

Transformar a arquitetura de stubs da Central de Integrações em conectores
homologáveis (dev/homolog) com caminhos `live` para endpoints oficiais/sandbox.

## Modo de operação

| `INTEGRACOES_MODE` | Comportamento |
|--------------------|---------------|
| `homolog` (default)| Shapes reais sem rede; WhatsApp/PIX/impressoras simulados |
| `live`             | HTTP real com credenciais + resiliência |
| `disabled`         | Bloqueia operações (inbox/logs permanecem) |

Aplicar SQL: `supabase/migrations/0052_integracoes_homologacao.sql`
(ou bundle `docs/sql/aplicar-0052-integracoes-homologacao.sql`).

## Provedores homologados

### Prioridade 1 — iFood
- OAuth (authorize URL + token exchange helpers)
- Importação/sincronização de cardápio (produtos)
- Recebimento de pedidos (polling + webhooks)
- Atualização de status / cancelamentos
- Estoque (`ifoodAtualizarEstoqueItem`)
- Assinatura de webhooks + reconciliação (`processPendingWebhooks`)

### Prioridade 2 — WhatsApp
- Cloud API + Evolution API
- Confirmação / pronto / saiu para entrega
- Templates (campanhas CRM + mensagens transacionais)

### Prioridade 3 — PIX
- Mercado Pago + Asaas (prioritários)
- PagSeguro / Stone / Cielo (homolog base)
- QR Code, consulta, webhooks, conciliação, estorno (`cancelar`)

### Prioridade 4 — Impressoras
- Epson, Elgin, Bematech, ESC/POS
- Setores: cozinha, bar, balcão, caixa

### Prioridade 5 — Cardápio digital
- QR da mesa (`/cardapio/[empresaId]/mesa/[mesaId]`)
- Autoatendimento / pedido na mesa (homolog)
- Pagamento online via PIX conectado

## Resiliência

- Retry exponencial (`withRetry`)
- Circuit breaker + rate limit por provedor
- Fila in-process + Dead Letter Queue
- Idempotência + HMAC de webhooks
- `callExternal()` combina rate + circuit + retry

## Painel

Central `/integracoes`:
- Status online/offline/pendente/erro
- Última sync, latência média
- Webhooks, falhas, retentativas, DLQ
- Uso por integração
- Logs + histórico de sync (observabilidade existente)

## Endpoints

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/webhooks/[provedor]` | Inbox oficial |
| POST | `/api/integrations/webhooks` | Inbox central |
| POST | `/api/integrations/webhooks/process` | Reconciliação manual |
| POST | `/api/integrations/sync` | Sync pedidos/produtos |
| POST | `/api/integrations/test` | Teste de conexão |
| POST | `/api/integrations/connect` | Conectar |
| POST | `/api/integrations/disconnect` | Desconectar |

## Eventos de webhook suportados

- Delivery (iFood etc.): `order_created`, `order_status`, `order_cancelled`
- PIX: `payment` / `payment.updated`
- Demais: classificados como `ignored` (registrados para auditoria)

## Testes

- Unitários: resiliência, registry, sync, webhook inbox/processor
- Contrato: `src/integrations/contracts/providers.contract.test.ts`
- Falha/reconexão: circuit breaker half-open → closed
- Mocks: modo `homolog` (sem rede)

## Roadmap seguinte

- Sprint 19 — Business Intelligence
- Sprint 20 — ChefHub AI
- Sprint 21 — Produção / hardening
