# Sprint 14 — Financeiro Completo (ERP Food Service)

Transforma o ChefHub em ERP financeiro: AP/AR, fluxo de caixa, DRE, centros
de custo, categorias, conciliação, dashboard, alertas e exportações.

## Banco (`0048`)

Migration: `supabase/migrations/0048_financeiro_erp.sql`  
Bundle: [`sql/aplicar-0048-financeiro-erp.sql`](./sql/aplicar-0048-financeiro-erp.sql)

| Tabela | Uso |
| ------ | --- |
| `financial_accounts` | Plano de contas |
| `accounts_payable` | Contas a pagar (parcelas, juros, multa, anexos) |
| `accounts_receivable` | Contas a receber (origens + baixa automática) |
| `cash_flow` | Entradas/saídas |
| `cost_centers` | Centros de custo (seed) |
| `financial_categories` | Receitas/despesas/transferências/investimentos/impostos |
| `bank_accounts` | Contas bancárias / caixa |
| `bank_transactions` | Conciliação |
| `financial_reports` | Snapshots de relatórios |
| `financial_forecasts` | Projeções |

RPC: `fn_seed_financeiro_defaults(empresa_id)` — centros + categorias + caixa.

RLS: owner / gerente / financeiro (`company_id` via `fn_empresas_acessiveis`).

## App

| Rota | Função |
| ---- | ------ |
| `/financeiro/erp` | Dashboard ERP (KPIs, DRE, alertas) |
| `/financeiro/contas-pagar` | AP |
| `/financeiro/contas-receber` | AR |
| `/financeiro/fluxo-caixa` | Fluxo |
| `/financeiro/dre` | DRE |
| `/financeiro/conciliacao` | Conciliação |
| `/financeiro/relatorios-erp` | Exportações |

API: `GET /api/financeiro/reports?tipo=&formato=csv|pdf|excel`

## Domínio

`src/features/financeiro/erp/` — calculations, actions, queries, validation, excel.

Observabilidade: auditoria em CRUD/baixas; alertas financeiros → `system_alerts`.

## Centros de custo (seed)

Produção, Cozinha, Bar, Administrativo, Marketing, Financeiro, RH.

## Limitações

- Impostos/folha no DRE ainda são proxies (sem engine fiscal completa)
- Excel = SpreadsheetML (`.xls`) sem lib externa
- Anexos = URL (sem upload Storage nesta sprint)
