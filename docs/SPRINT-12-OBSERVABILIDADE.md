# Sprint 12 — Observabilidade, Auditoria e Monitoramento

Torna a plataforma pronta para operação com trilha de auditoria, logs,
alertas, métricas, health check e painel administrativo por empresa.

## Banco (`0046`)

Migration: `supabase/migrations/0046_observabilidade_auditoria.sql`

Bundle: [`sql/aplicar-0046-observabilidade.sql`](./sql/aplicar-0046-observabilidade.sql)

| Tabela | Uso |
| ------ | --- |
| `auditoria_eventos` | Ações (login, CRUD, pedidos, pagamentos, permissões…) |
| `system_logs` | INFO / WARNING / ERROR / CRITICAL |
| `system_alerts` | Alertas operacionais (estoque, pedidos, integração…) |
| `performance_samples` | Amostras ≥300ms (rota / rpc / sql / render) |

RPC: `fn_registrar_auditoria` (SECURITY DEFINER).

RLS: insert por membro autenticado da empresa; **select** de auditoria/logs/
alertas/performance apenas **owner** e **gerente** da empresa (`company_id`
via `fn_empresas_acessiveis` + `fn_papel_na_empresa`).

Checkpoint SQL: `supabase/tests/checkpoint6_observabilidade_0046.sql`.

## Servidor

- `src/server/observabilidade/auditoria.ts` — `registrarAuditoria`
- `src/server/observabilidade/logs.ts` — `registrarLog`, `comMedicao`
- `src/server/observabilidade/alerts.ts` — `criarAlerta`, sync operacional
- `src/server/observabilidade/metrics.ts` — métricas do painel
- `src/server/observabilidade/health.ts` — health check
- `src/server/observabilidade/require-gestao.ts` — gate owner/gerente

## App

- Página: `/admin` (nav **Gestão → Monitoramento**)
- Feature: `src/features/observabilidade/`
- Componentes: `AuditTimeline`, `AuditTable`, `SystemHealth`, `ErrorPanel`,
  `AlertsPanel`, `MetricsDashboard`, `PerformanceCard`, `SystemStatus`,
  `ActivityFeed`

## APIs

| Rota | Método |
| ---- | ------ |
| `/api/admin/audit` | GET |
| `/api/admin/logs` | GET |
| `/api/admin/metrics` | GET |
| `/api/admin/alerts` | GET, PATCH |
| `/api/admin/system` | GET |
| `/api/admin/health` | GET |

Todas exigem sessão + papel owner/gerente na empresa ativa.

## Instrumentação

- Auth: login / logout / signup
- Pedidos: criar, confirmar, preparo, avanço, concluir, cancelar, pagamento
- Caixa: abrir / fechar
- Estoque: entrada / saída
- Equipe: convite / alteração de papel

## Testes

- `src/features/observabilidade/permissions.test.ts` — RBAC + isolamento
- `src/features/observabilidade/alerts.test.ts`
- `src/features/observabilidade/metrics.test.ts`
- `src/server/observabilidade/health.test.ts`
- Atualizações em `permissoes-rota.test.ts` e dashboard permissions (gerente
  vê auditoria da própria empresa)

## Limitações

- “Sessões abertas” ≈ membros ativos (sem presença realtime)
- Uso de banco detalhado depende do painel Supabase
- Amostras de performance só são gravadas quando `comMedicao` / limiar 300ms
  é atingido nas rotas instrumentadas
- Aplicar `0046` no Supabase remoto antes de usar o painel em produção
