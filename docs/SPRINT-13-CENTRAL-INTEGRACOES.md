# Sprint 13 — Central de Integrações

Infraestrutura desacoplada para delivery, WhatsApp, PIX, impressoras e
cardápio digital. **Sem credenciais reais e sem chamadas de produção** —
stubs lançam `IntegrationNotAvailableError` até a Sprint 16 (homologação).

## Banco (`0047`)

Migration: `supabase/migrations/0047_central_integracoes.sql`  
Bundle: [`sql/aplicar-0047-central-integracoes.sql`](./sql/aplicar-0047-central-integracoes.sql)

| Tabela | Uso |
| ------ | --- |
| `integrations` | Conexão por empresa + provider |
| `integration_credentials` | Ciphertext AES-256-GCM (nunca plaintext) |
| `integration_logs` | Logs INFO/WARNING/ERROR/CRITICAL |
| `integration_events` | Histórico de eventos |
| `integration_syncs` | Sincronizações |
| `integration_webhooks` | Inbox de webhooks |
| `integration_failures` | Falhas / tentativas |

RLS: select gestão (owner/gerente); mutação **owner**. Webhooks: insert via
service-role.

Tabelas legadas `integracoes_*` (Sprint 04) permanecem; dual-write só para
`ifood|99food|keeta|open_delivery`.

## Interfaces

- `IntegrationProvider` — conectar, desconectar, sync produtos/pedidos,
  atualizar status, testar, validar webhook
- `WhatsAppCapabilities` — mensagem, template, status
- `PixGateway` — QR, consulta, cancelar, webhook, conciliação
- `PrinterDriver` — impressão por tipo (pedido/cozinha/bar/balcão/comprovante)
- `DigitalMenuCapabilities` — QR mesa, autoatendimento

Registry: `src/integrations/registry.ts` (`obterProvider`).

## APIs

| Rota | Método |
| ---- | ------ |
| `/api/integrations` | GET |
| `/api/integrations/test` | POST |
| `/api/integrations/connect` | POST |
| `/api/integrations/disconnect` | POST |
| `/api/integrations/sync` | POST |
| `/api/integrations/logs` | GET |
| `/api/integrations/webhooks` | POST |
| `/api/integrations/status` | GET |

Mutações exigem `requireOwner()`. Webhooks usam service-role.

## UI

`/integracoes` — Central com cards por categoria, status online/offline,
último sync, conectar / desconectar / testar / sincronizar, logs e histórico.

## Observabilidade

Falhas, logs, eventos e amostras ≥300ms vão para o módulo da Sprint 12
(`system_logs`, `system_alerts`, `performance_samples`, `auditoria_eventos`).

## Segurança

- `INTEGRACOES_SECRET_KEY` (32 bytes base64) — AES-256-GCM + AAD `empresa:provider`
- Credenciais nunca retornam ao client (`has_credentials` apenas)
- Isolamento por `empresa_id` + RLS + RBAC owner
