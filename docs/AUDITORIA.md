# Auditoria Completa — Chef Hub Profissional

**Data:** 2026-07-21 (atualizado com remediação P0/P1)  
**Branch base:** `claude/sprint-01-fundacao`  
**Escopo:** código, schema Supabase, documentação, segurança, qualidade e cobertura de testes  
**Veredito:** o produto está **funcionalmente avançado (Sprints 01–05)** com build/lint/typecheck/unit tests verdes. Os Critical/High de segurança e integridade listados abaixo foram **corrigidos** nas migrations `0040`–`0041` e nas Server Actions. Pendências restantes são features externas (APIs marketplace, agente Windows, PWA, PDF, RH).

---

## 1. Resumo executivo

| Dimensão | Nota | Situação |
| -------- | ---- | -------- |
| Entrega funcional | Alta | Cadastros, estoque, financeiro, CRM, dashboard, pedidos, PDV, KDS, caixa, mesas, expedição |
| Qualidade de build | Alta | `typecheck`, `lint` e `build` passam sem erros |
| Documentação | Baixa | README ainda fala em Sprint 01; Sprint 05 sem docs |
| Segurança / integridade | Alta (pós-0040) | Máquina de estados, ownership RPC, empresa_id nas actions, webhooks fechados, KDS por praça |
| Testes | Média | 6 unitários (Vitest) + 7 e2e Playwright + SQL checkpoints; cobertura e2e ainda parcial |
| Integrações externas | Stub | Adapters lançam erro explícito; webhooks exigem assinatura (ou flag de dev) |
| Pronto para produção | Condicional | Aplicar migrations `0040`–`0041` no Supabase; configurar secrets; features externas ainda stub |

### Contagem objetiva

| Métrica | Valor |
| ------- | ----- |
| Arquivos TS/TSX em `src/` | 301 |
| Páginas (`page.tsx`) | 55 |
| Migrations SQL | 39 (`0001`–`0039`) |
| Specs e2e | 7 |
| Tipos gerados (`database.types.ts`) | ~2.856 linhas |
| Dependências npm (prod) | vulnerabilidade moderada transitiva em `postcss` via Next (sem fix seguro imediato) |

---

## 2. Estado do produto por sprint

### Sprint 01 — Fundação ✅

Design System, tema claro/escuro, layout, auth email/senha, onboarding multi-empresa, componentes UI.

### Sprint 02 — Operacional base ✅

Fichas técnicas (CMV/margem/markup + versionamento), ingredientes, estoque FIFO, inventários, compras, produção, lista inteligente.

### Sprint 03 — Financeiro ✅

Precificação, custos fixos/variáveis, canais, ponto de equilíbrio, metas, simulador de promoções, painel “Nunca no Vermelho”.

### Sprint 04 — Analytics / CRM / Etiquetas / Integrações ✅ (com stubs)

Dashboard, vendas manuais, clientes, 8 relatórios + CSV, etiquetas + fila de impressão + contrato do agente, estrutura de integrações (sem API real). PDF = 501.

### Sprint 05 — Pedidos / PDV / Caixa / Mesas / KDS / Expedição ✅ no código, ❌ na docs

| Módulo | Rotas | Feature folder | Migrations |
| ------ | ----- | -------------- | ---------- |
| Pedidos | `/pedidos`, `/pedidos/novo`, `/pedidos/[id]` | `features/pedidos` | `0030`, `0033`, `0034` |
| PDV | `/pdv` (route group `(pos)`) | aninhado em `pedidos` | — |
| Caixa | `/caixa`, `/caixa/[id]` | `features/caixa` | `0031`, `0032` |
| Mesas | `/mesas`, `/mesas/[id]` | `features/mesas` | `0035` |
| KDS | `/kds` (route group `(pos)`) | `features/kds` (só queries/UI) | `0037` |
| Expedição | `/expedicao` | `features/expedicao` | `0036` |
| Impressão pedidos | triggers + `features/impressao` | parcial | `0038` |
| Estoque ↔ pedido | referência `pedido` | — | `0039` |

**Contradicção documental crítica:** PRODUCT-VISION / ARCHITECTURE dizem que PDV é “só reserva de nome”. O código tem PDV/KDS fullscreen reais.

---

## 3. Arquitetura observada

```
src/
  proxy.ts                 # refresh de sessão (não é gate de auth)
  app/(marketing|auth|app|pos)/
  features/*               # 26 módulos de domínio
  integrations/*           # 4 adapters stub
  server/auth/             # DAL + empresa ativa (cookie)
  lib/supabase/            # client / server / service-role / types
supabase/migrations/       # 0001–0039
e2e/                       # Playwright (foco Sprint 05)
docs/                      # atualizado até Sprint 04 (+ este arquivo)
```

### Pontos fortes

- Separação clara Server Components / Server Actions / queries / Zod
- Fórmulas financeiras centralizadas em `calculations.ts` (não duplicadas no SQL à toa)
- Multi-empresa via cookie validado + RLS por `empresas.usuario_id = auth.uid()`
- Service-role restrito a agente de impressão e webhooks
- Adapters de integração falham alto (`IntegracaoNaoDisponivelError`) — não fingem sucesso

### Pontos fracos estruturais

- Nav monólito com 18 links horizontais (`app-header.tsx`) — UX frágil em mobile
- Sem RBAC (dono = único usuário Auth da empresa; PDV/caixa/cozinha compartilham a mesma identidade)
- KDS sem `actions`/`validation` próprios
- PDV sem pasta própria
- PWA anunciado, não implementado (sem manifest / service worker)

---

## 4. Qualidade de código e CI local

| Check | Resultado |
| ----- | --------- |
| `npm run typecheck` | ✅ passa |
| `npm run lint` | ✅ passa |
| `npm run build` | ✅ 49 rotas geradas, Proxy ok |
| `npm audit` (prod) | ⚠️ 2 moderate (`postcss` via `next`) — fix forçado quebraria Next |
| Testes unitários | ❌ inexistentes (sem Jest/Vitest, sem script `test`) |
| Scripts e2e no `package.json` | ❌ Playwright instalado, sem `test:e2e` |

### Dívidas de padrão (CODING-STANDARDS)

- `window.confirm` ainda em 7+ managers (ConfirmDialog existe mas não migrou o restante)
- `ConfirmDialog` fora do barrel `components/ui/index.ts`
- `eslint-disable` + `as never` em `use-realtime-refresh.ts`
- Sem TODOs no código — gaps vivem só na documentação (bom) e em stubs explícitos

---

## 5. Segurança e integridade de dados

Severidades: **Critical** / **High** / **Medium** / **Low**.

### Critical

| # | Achado | Evidência | Correção sugerida |
| - | ------ | --------- | ----------------- |
| C1 | `fn_proximo_numero_pedido` é SECURITY DEFINER, `GRANT` a `authenticated`, **sem** checagem de ownership | `0030_pedidos_core.sql` | Exigir `empresas.usuario_id = auth.uid()` ou revogar EXECUTE e chamar só via trigger com owner |
| C2 | RLS permite `UPDATE` livre em `pedidos` (incl. `status`) — bypass da máquina de estados / estoque / vendas | `pedidos_update_own` + `pedidos/actions.ts` | Restringir escrita de `status` às RPCs; trigger de transição |
| C3 | Mutações de itens/valores do pedido **sem** guard de `status = rascunho` (só UI desabilita) | `pedidos/actions.ts` | Checagem na action + trigger/CHECK no banco |
| C4 | KDS filtra por praça na UI mas avança status do **pedido inteiro** | `kds-board.tsx` | Status por item/praça, não por pedido |

### High

| # | Achado | Evidência |
| - | ------ | --------- |
| H1 | `salvar_ficha_tecnica` (DEFINER) não valida `ingrediente_id` pertencer à mesma empresa | `0010_*.sql` |
| H2 | Child rows (`pedido_itens`, `pagamentos`, …) checam `empresa_id` próprio, não o do pai | policies `0030`/`0032` |
| H3 | Ledger de estoque/caixa mutável direto pelo client (bypass das RPCs FIFO) | `0013`, `0031` |
| H4 | Webhook inbox aberto: qualquer POST grava via service-role, sem assinatura/rate-limit | `api/webhooks/[provedor]/route.ts` |
| H5 | Server Actions mutam por `id` sem `.eq("empresa_id", empresaAtual.id)` — vazamento entre empresas do **mesmo** usuário | vários `features/*/actions.ts` |
| H6 | Pagamentos sem teto vs `pedido.total`; `caixa_id` sem validar operador/empresa aberta | `fn_registrar_pagamento_pedido` |
| H7 | Qualquer usuário da empresa pode fechar/movimentar caixa de outro operador | `fn_fechar_caixa` |
| H8 | `finalizarVendaPdv` não é atômico — falha no meio deixa pedido fora de `rascunho` e some do PDV | `pedidos/actions.ts` |
| H9 | Pedido `retirada` cria expedição mas UI ainda permite “Concluir” direto | `pedido-detalhe.tsx` + `0036` |
| H10 | Ciphertext de credenciais e `chave_api_hash` vão ao browser | `integracoes/queries.ts`, `etiquetas/queries.ts` |

### Medium / Low (seleção)

- Agent print: sem claim atômico / máquina de estados de job
- Crypto AES-GCM ok, mas sem AAD nem rotação de chave
- `proxy.ts` não redireciona rotas protegidas (layouts + RLS compensam)
- Validação Zod incompleta em várias actions de UUID/listas
- Statuses de mesa `reservada`/`fechando` no schema, nunca escritos
- Adicional na baixa de estoque não escala pela qty do item pai

### O que está bem

- Auth refresh via `getUser()` no proxy
- Layouts `(app)`/`(pos)` exigem sessão + empresa
- Service-role isolado e marcado `server-only`
- Agente: Bearer → SHA-256 → filtro por `empresa_id`
- Credenciais de integração cifradas (AES-256-GCM) no app, não em plaintext no banco
- RLS presente nas tabelas críticas das Sprints 01–05

---

## 6. Cobertura de testes

### Existe

| Camada | Onde | Cobertura |
| ------ | ---- | --------- |
| E2E Playwright | `e2e/01`–`07` | login, dashboard, ciclo de pedido, caixa, PDV, mesas, visual QA |
| SQL | `supabase/tests/checkpoint2_*.sql` | pedidos operacional |

### Não existe / gaps

- Unitários de `calculations.ts` (financeiro, fichas, pedidos) — alto valor, zero custo de infra
- E2E: estoque, compras, fichas, financeiro, relatórios, integrações, etiquetas
- E2E Sprint 05: KDS ações, expedição, baixa de estoque, overpay, transferir/unir comandas, `bloquear_venda_sem_estoque`
- Script `npm run test` / `test:e2e` ausente no `package.json`
- Credenciais e2e hardcoded em `e2e/fixtures.ts` (ok para seed local; documentar que não são secrets de produção)

---

## 7. Drift de documentação (prioridade)

1. **`README.md`** — afirma “Sprint 01 / nenhuma funcionalidade de negócio” → **falso**
2. **Sem `docs/SPRINT-05.md`** — migrations `0030`–`0039` e features operacionais sem narrativa
3. **`PRODUCT-VISION.md` / `ARCHITECTURE.md`** — PDV “só nome”; árvore omite `(pos)`, pedidos, caixa, mesas, KDS, expedição
4. **`DATABASE.md`** — sem seção Sprint 05; regra “vendas não baixam estoque” precisa distinguir `/vendas` vs ciclo de pedido
5. **`AGENTE-LOCAL.md`** — só `etiqueta_validade`; faltam tipos de comprovante de pedido/caixa
6. **`COMPONENTS.md`** — falta `ConfirmDialog`
7. **`docs/README.md`** — índice para na Sprint 04

---

## 8. Funcionalidades incompletas (produto)

| Item | Estado |
| ---- | ------ |
| Calculadora de custos de funcionários / RH | Não iniciado |
| Exportação PDF de relatórios | Stub 501 |
| APIs reais iFood / 99Food / Keeta / Open Delivery | Stub com erro explícito |
| Validação de assinatura de webhook | Sempre `false` |
| Executável Windows do agente de impressão | Só contrato HTTP |
| Adapters PDV/ERP externos | Só reserva de nome (PDV **interno** já existe) |
| PWA | Anunciado, não implementado |
| RBAC multi-operador | Ausente (modelo single-owner) |

---

## 9. UX / Design System

### Conforme

- Tokens semânticos em `tokens.css`, tema `data-theme`, fontes Geist
- Inventário UI alinhado a COMPONENTS.md (exceto ConfirmDialog)
- Route groups claros para marketing / auth / app / POS fullscreen

### Atenções

- Header com 18 links — sem agrupamento por domínio (Operação / Cadastros / Financeiro)
- Home pública ainda é vitrine do Design System, não landing de produto
- `window.confirm` nativo em vários CRUDs vs ConfirmDialog novo
- Tipografia: Geist (aceitável no DS atual; regra de frontend “evitar Inter/system” não se aplica se o DS do repo manda Geist)

---

## 10. Roadmap de remediação

### Concluído nesta rodada (P0/P1 + stubs internos)

- [x] Ownership em `fn_proximo_numero_pedido` (`0040`)
- [x] Máquina de estados + itens só em `rascunho` (triggers)
- [x] Webhook inbox fechado (assinatura ou flag de dev)
- [x] `.eq("empresa_id", empresa.id)` nas Server Actions
- [x] Pagamento com teto + caixa/operador
- [x] KDS por praça (`status_preparo` + `fn_marcar_itens_pronto`)
- [x] Conclusão entrega/retirada via Expedição
- [x] PDV atômico (`fn_finalizar_venda_pdv`)
- [x] Sem ciphertext/`chave_api_hash` no client
- [x] Claim atômico + transições da fila de impressão
- [x] Nav agrupada + `ConfirmDialog` + `SPRINT-05.md` + Vitest
- [x] PWA (manifest + service worker)
- [x] Exportação PDF dos relatórios
- [x] Calculadora de custos de funcionários (`0042`)
- [x] Agente local Node (`agents/impressao/`)
- [x] Crypto AAD + migração `window.confirm` → `ConfirmDialog`

### Ainda aberto (parceiros externos)

- Chamadas reais iFood / 99Food / Keeta / Open Delivery (credenciais de homologação)
- Adapters de PDV/ERP de terceiros
- Driver ESC/POS nativo no Windows (agente grava outbox; impressão física é do ambiente)
---

## 11. Conclusão

O Chef Hub deixou de ser “fundação” há várias sprints: há um back-office completo de food service **e** um núcleo operacional de sala (pedidos → PDV → KDS → caixa → mesas → expedição) com build saudável. O maior risco agora não é “falta de feature”, e sim **(a)** documentação desatualizada que esconde a Sprint 05, e **(b)** buracos de integridade onde a UI sugere regras que o banco/RLS ainda não impõem.

**Recomendação:** tratar o P0 de segurança como pré-requisito de produção; em paralelo, alinhar a documentação ao código real (este relatório + atualização do README/índice).

---

## Apêndice A — Rotas autenticadas (mapa rápido)

Marketing: `/`  
Auth: `/login`, `/cadastro`, `/onboarding`, `/auth/confirm`  
Operação: `/pedidos*`, `/pdv`, `/caixa*`, `/mesas*`, `/kds`, `/expedicao`  
Cadastros: `/fichas-tecnicas*`, `/ingredientes`, `/categorias`, `/unidades-medida`  
Estoque/Compras: `/estoque*`, `/compras*`, `/producao`, `/lista-compras*`  
Financeiro/Analytics: `/financeiro*`, `/dashboard`, `/vendas`, `/clientes*`, `/relatorios`  
Plataforma: `/integracoes`  
APIs: `/api/agente-impressao/*`, `/api/relatorios/[tipo]`, `/api/webhooks/[provedor]`

## Apêndice B — Variáveis de ambiente

| Variável | Uso |
| -------- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Clients browser/server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clients (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Agente + webhooks apenas |
| `INTEGRACOES_SECRET_KEY` | AES-256-GCM das credenciais |

Ver `.env.example`.
