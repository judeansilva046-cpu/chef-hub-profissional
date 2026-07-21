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

| Papel | Escopo de rotas |
| ----- | --------------- |
| owner / gerente | Tudo |
| caixa | dashboard, pedidos, PDV, caixa, expedição, vendas, clientes |
| cozinha | dashboard, pedidos, KDS, produção, fichas técnicas |
| garcom | dashboard, pedidos, PDV, mesas, expedição, clientes |

Home padrão: caixa → `/pdv`, cozinha → `/kds`, garçom → `/mesas`.

## Limitações desta entrega

- Mutações operacionais (PDV/caixa/KDS) ainda não checam papel em cada
  Server Action — a barreira principal é rota + nav; RLS continua por tenant.
- E2E cobre só smoke da página (sem segundo usuário).
