# Sprint 19 — Business Intelligence (BI Executivo)

## Objetivo

Consolida indicadores operacionais, financeiros e comerciais em dashboards
executivos com comparativos, drill-down, metas e exportação.

## Rotas

| Rota | Dashboard |
|------|-----------|
| `/bi` | Visão geral |
| `/bi/financeiro` | Financeiro |
| `/bi/vendas` | Vendas |
| `/bi/delivery` | Delivery |
| `/bi/salao` | Salão |
| `/bi/estoque` | Estoque |
| `/bi/crm` | CRM |
| `/bi/kds` | KDS |
| `/bi/funcionarios` | Funcionários |
| `/bi/metas` | Metas |

Exportação: `GET /api/bi/export?dashboard=&formato=csv|excel|pdf&dataInicio=&dataFim=`

## KPIs

- **Financeiro:** receita, lucro, margem, EBITDA (quando houver depreciação), fluxo de caixa, CMV %
- **Operação:** tempo médio de preparo/entrega/atendimento, pedidos/hora
- **Estoque:** CMV, giro, cobertura, perdas
- **CRM:** ticket médio, frequência, retenção, LTV, clientes ativos
- **Delivery:** cancelamentos, tempo médio, avaliações (quando houver), receita por canal

## Comparativos

Hoje × Ontem · Semana × Semana · Mês × Mês · Ano × Ano

## Drill-down

Empresa → Unidade (canal de venda) → Categoria (praça de produção) → Produto → Pedido

> Não há tabela de filiais no schema atual; “unidade” = canal operacional.

## Metas (`bi_metas`)

Tipos: faturamento, lucro, CMV, ticket médio, vendas, desperdício.  
Progresso em tempo real; CMV/desperdício são metas invertidas (menor é melhor).

SQL: `supabase/migrations/0053_bi_executivo.sql`

## Segurança

- RBAC: owner, gerente, financeiro (`PAPEIS_BI_LEITURA`)
- Financeiro não vê KDS / salão / funcionários
- RLS em `bi_metas` via `fn_empresas_acessiveis` + `fn_papel_na_empresa`
- Isolamento por `empresa_id` em todas as queries

## Roadmap

- Sprint 20 — ChefHub AI (perguntas em linguagem natural sobre os mesmos dados)
- Sprint 21 — Produção / hardening
