# Sprint 06 — RBAC multi-operador

Permite vários usuários Auth por empresa, com papéis, sem remover o owner
primário em `empresas.usuario_id`.

## Modelo

| Conceito | Onde |
| -------- | ---- |
| Owner primário | `empresas.usuario_id` (único que pode `UPDATE` a empresa) |
| Membros | `membros_empresa` (`papel`: owner, gerente, caixa, cozinha, garcom) |
| Acesso tenant | `fn_empresas_acessiveis()` — union dono + membros ativos |
| Papel atual | `fn_papel_na_empresa(empresa_id)` — owner se for `empresas.usuario_id` |

## Migration

`supabase/migrations/0043_membros_empresa_rbac.sql` (bundle:
[`docs/sql/aplicar-0043-rbac.sql`](./sql/aplicar-0043-rbac.sql))

- Backfill owner por empresa + trigger `AFTER INSERT` em `empresas`
- Trigger protege remoção/desativação/demotion do owner primário
- Rewrite dinâmico de policies RLS (`empresa_id in (select … usuario_id)`)
  → `empresa_id in (select fn_empresas_acessiveis())`
- `fn_convidar_membro_por_email` (owner/gerente; usuário precisa já ter conta)

## App

- `/equipe` — lista, convite por e-mail, alterar papel, ativar/remover
- `getPapelNaEmpresaAtual` / `requirePapel` em `src/server/auth/`
- Nav **Gestão → Equipe**
- **Rotas por papel** — `permissoes-rota.ts` + filtro no `AppHeader` e
  redirect nos layouts `(app)` / `(pos)` via header `x-pathname` no proxy
- **Server Actions por papel** — `requirePapel` + `papeis-acoes.ts`
  (caixa/cozinha/garçom/sala/expedição; back-office só owner/gerente)

| Papel | Escopo de rotas |
| ----- | --------------- |
| owner / gerente | Tudo |
| caixa | dashboard, pedidos, PDV, caixa, expedição, vendas, clientes |
| cozinha | dashboard, pedidos, KDS, produção, fichas técnicas |
| garcom | dashboard, pedidos, PDV, mesas, expedição, clientes |

| Ações (exemplos) | Papéis além de owner/gerente |
| ---------------- | ---------------------------- |
| Abrir/fechar caixa, pagamento | caixa |
| KDS (iniciar/marcar pronto) | cozinha |
| Mesas/comandas | garcom |
| Pedidos/PDV (montar, confirmar, finalizar) | caixa, garcom |
| Expedição | caixa, garcom |
| Estoque, financeiro, cardápio mutável, integrações | — (só gestão) |

Home padrão: caixa → `/pdv`, cozinha → `/kds`, garçom → `/mesas`.

## RLS por papel na escrita (`0044`)

Bundle: [`docs/sql/aplicar-0044-rbac-papel-rls.sql`](./sql/aplicar-0044-rbac-papel-rls.sql)

- Helpers `fn_papel_em` / `fn_assert_papel` / `fn_assert_papel_pedido`
- RPCs operacionais viram `SECURITY DEFINER` com assert de papel (side-effects
  de estoque/vendas continuam funcionando para caixa/cozinha/garçom)
- Policies **RESTRICTIVE** em INSERT/UPDATE/DELETE por grupo (SELECT segue
  tenant via `fn_empresas_acessiveis`)

## Limitações desta entrega

- E2E de operadores (`e2e/13-rbac-papeis`) faz skip se os usuários
  caixa/cozinha/garçom não estiverem seedados — ver
  [`docs/sql/seed-e2e-operadores-rbac.sql`](./sql/seed-e2e-operadores-rbac.sql).
- SELECT ainda é por tenant (membro ativo vê dados de gestão no Dashboard);
  o endurecimento de `0044` é na **escrita**.
