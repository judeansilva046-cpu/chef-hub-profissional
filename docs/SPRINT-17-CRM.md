# Sprint 17 — CRM, Fidelização e Marketing

Módulo de relacionamento com clientes: perfil enriquecido, fidelidade,
cashback, cupons, segmentação, campanhas e automações (envio via Central
de Integrações).

## Banco (`0051`)

Migration: `supabase/migrations/0051_crm_fidelizacao.sql`  
Bundle: [`sql/aplicar-0051-crm-fidelizacao.sql`](./sql/aplicar-0051-crm-fidelizacao.sql)

| Tabela | Uso |
| ------ | --- |
| `customers_profiles` | Perfil CRM + consentimentos LGPD |
| `customer_preferences` | Preferências chave/valor |
| `loyalty_programs` | Regras por empresa |
| `loyalty_points` | Acúmulo / resgate / validade |
| `cashback_transactions` | Créditos e débitos de cashback |
| `coupons` / `coupon_redemptions` | Cupons e resgates |
| `customer_segments` | Segmentos dinâmicos |
| `marketing_campaigns` / `campaign_recipients` | Campanhas e destinatários |
| `communication_logs` | Histórico de comunicação |

RPC: `fn_seed_crm_defaults(empresa_id)` — programa + segmentos padrão.

## App

| Rota | Função |
| ---- | ------ |
| `/crm` | Dashboard KPI |
| `/crm/fidelidade` | Regras de pontos/cashback |
| `/crm/cupons` | Criação e listagem |
| `/crm/segmentos` | Segmentação dinâmica |
| `/crm/campanhas` | Campanhas + disparo |

## API

`GET/POST /api/crm/[tipo]`

Tipos: `clientes`, `fidelidade`, `cashback`, `pontos`, `cupons`, `segmentacao`, `campanhas`, `comunicacao`, `relatorios`, `analytics`.

## Integração

`src/features/crm/communication.ts` consome capabilities WhatsApp da Central
(`whatsapp_cloud` / `evolution_api`). Enquanto stubs, logs ficam `failed`/`queued`
com mensagem de homologação (Sprint 18).

## Segurança

RBAC rota `/crm`; RLS por `empresa_id` + papel; auditoria nas actions;
consentimentos LGPD bloqueiam envio sem opt-in.

## Roadmap

18 Homologação integrações → 19 BI → 20 IA gestão → 21 Hardening
