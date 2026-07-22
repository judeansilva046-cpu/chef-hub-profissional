# Sprint 20 — ChefHub AI

## Objetivo

Transformar o BI em um **copiloto de gestão** em linguagem natural, usando
exclusivamente os dados do restaurante (ERP + BI + CRM + estoque).

## Superfície

| Rota | Função |
|------|--------|
| `/ai` | Copiloto interativo |
| `POST /api/ai/ask` | API `{ pergunta }` → resposta + explicação |

## Intenções suportadas

- Queda de lucro / margem
- Fornecedor que mais aumentou preços
- O que comprar amanhã
- Desperdício por produto
- Garçom que mais vende sobremesas
- Melhor campanha CRM
- Simulação de preço (+X% na margem)
- Previsão de vendas (heurística)
- Produtos mais lucrativos
- CMV em alta
- Clientes inativos (60d+)
- Melhor canal/unidade

Cada resposta inclui: **resposta**, **explicação** (como chegou à conclusão) e
**fontes** (módulos/dados usados).

## Arquitetura

```
pergunta → detectarIntencao → montarContextoChefHubAi → responderChefHubAi
```

- Sem LLM externo na Sprint 20 (determinístico, auditável, sem vazamento)
- Log em `ai_query_logs` (migration `0054`) + auditoria
- RBAC: owner, gerente, financeiro

## Roadmap

- **Sprint 21 — Automações Inteligentes:** agir automaticamente (compras, alertas CMV, campanhas, anomalias)
- **Sprint 22 — Produção:** CI/CD, carga, backup, feature flags, LGPD, pentest
