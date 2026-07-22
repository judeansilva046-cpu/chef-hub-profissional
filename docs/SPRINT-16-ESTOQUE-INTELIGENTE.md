# Sprint 16 — Estoque Inteligente + IA de Compras

Transforma o estoque em módulo preditivo: ABC, giro, consumo, previsão,
sugestões automáticas, perdas, CMV inteligente e IA de compras.

## Banco (`0050`)

Migration: `supabase/migrations/0050_estoque_inteligente.sql`  
Bundle: [`sql/aplicar-0050-estoque-inteligente.sql`](./sql/aplicar-0050-estoque-inteligente.sql)

| Tabela | Uso |
| ------ | --- |
| `inventory_batches` | Lotes com fabricação, validade e rastreabilidade (sync com `estoque_lotes`) |
| `inventory_counts` / `inventory_count_items` | Inventário parcial / geral / por setor |
| `inventory_losses` | Quebra, vencimento, desperdício, produção |
| `purchase_suggestions` | Sugestões automáticas de compra |
| `inventory_forecasts` | Previsões de consumo/compra |
| `inventory_analytics` | Snapshots (dashboard, ABC, CMV…) |

Também: `estoque_lotes.data_fabricacao`, `codigo_rastreabilidade`; `estoque_inventarios.tipo`, `setor`.

RPC: `fn_registrar_perda_estoque` (baixa estoque + registra perda).

RLS: owner / gerente (analytics select também financeiro).

## App

| Rota | Função |
| ---- | ------ |
| `/estoque/inteligente` | Dashboard ABC, giro, CMV, alertas, previsão, IA |
| `/estoque/sugestoes` | Sugestões abertas (aceitar / rejeitar / comprada) |
| `/estoque/perdas` | Registro e histórico de perdas |

## API

`GET/POST /api/estoque/inteligente/[tipo]`

Tipos GET: `analytics`, `abc`, `consumo`, `previsoes`, `sugestoes`, `perdas`, `lotes`, `inventario`, `compras`, `giro`, `cmv`, `alertas`  
Tipos POST: `ia`, `perdas`, `sugestoes`

## Domínio

`src/features/estoque/inteligente/` — calculations, ia, actions, queries, validation, components.

## IA de Compras

Responde (rule-based + dados reais):

- O que preciso comprar amanhã?
- Qual fornecedor está mais barato?
- Quanto vou consumir na próxima semana?
- Qual produto está parado?
- Qual produto gira mais?
- Quanto dinheiro está parado em estoque?
- Qual produto mais gera desperdício?

## Roadmap seguinte

17 CRM → 18 Homologação integrações → 19 BI → 20 ChefHub AI → 21 Hardening

## Limitações

- Sazonalidade = razão 7d / 30d (proxy simples)
- CMV usa aproximação EI a partir de EF + movimentos do período
- IA é determinística (sem LLM externo nesta sprint)
