# Sprint 11 — Dashboard inteligente por papel

Complementa o RBAC (`0043`–`0045`) com experiência de dashboard e navegação
por função. **Dados não autorizados não são buscados no servidor** — não é
apenas ocultar UI.

## Papéis

| Papel | Dashboard | Nav (resumo) |
| ----- | --------- | ------------ |
| owner | Executivo completo + auditoria + equipe | Tudo |
| gerente | Operacional (sem admin) | Tudo exceto `/equipe`, `/integracoes` |
| financeiro | Faturamento, margem, a receber/pagar | `/dashboard`, `/financeiro`, `/relatorios`, `/vendas`, `/clientes` |
| caixa | Pedidos + caixa do turno | PDV, caixa, pedidos, vendas, clientes |
| cozinha | Fila KDS / tempos / expedição | KDS, produção, pedidos, fichas |
| garcom | Mesas + pedidos + atalho novo pedido | Mesas, PDV, pedidos, clientes, expedição |

## App

- Loader: `src/features/dashboard/queries-por-papel.ts` (`carregarDashboardPorPapel`)
- Matriz: `src/features/dashboard/permissions.ts`
- UI: `DashboardLayout`, `DashboardSection`, `DashboardCard`, `MetricCard`,
  `QuickAction`, `RoleDashboard`, `PermissionGate`, `RoleGuard`
- Página: `src/app/(app)/dashboard/page.tsx` (Suspense + por papel)
- Admin estrito: `requireOwner()` em `/equipe` e integrações

## Banco

`supabase/migrations/0045_papel_financeiro_dashboard.sql` — papel
`financeiro` + policies de escrita financeira + convite só por owner.

Bundle: [`docs/sql/aplicar-0045-papel-financeiro.sql`](./sql/aplicar-0045-papel-financeiro.sql)

## Testes

- `permissions.test.ts` — blocos/permissões por papel
- `permissoes-rota.test.ts` — menu/rotas (gerente sem equipe; financeiro sem estoque)

## Limitações

- “Contas a pagar” = qtd de pedidos de compra pendentes (sem ledger AP completo)
- “Usuários online” = membros ativos (não presença realtime)
- “Chamados” de garçom ainda não existem como entidade
