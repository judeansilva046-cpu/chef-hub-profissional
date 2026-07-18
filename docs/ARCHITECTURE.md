# Arquitetura

## Stack

- **Next.js 16** (App Router, Turbopack por padrão, React 19.2)
- **TypeScript** em modo `strict`
- **Tailwind CSS v4** (configuração CSS-first via `@theme`, sem
  `tailwind.config.js`)
- **Supabase** (Postgres + Auth) via `@supabase/ssr`
- **Zod** para validação de formulários e Server Actions
- **Radix UI** (`Dialog`, `Tabs`, `Popover`) + `cmdk` como motor headless de
  acessibilidade para os componentes mais complexos do Design System
- **ESLint** (flat config) + **Prettier**

> Next.js 16 tem diversas mudanças de convenção em relação a versões
> anteriores (Turbopack estável por padrão, `next lint` removido, APIs de
> request assíncronas, `middleware` renomeado para `proxy`, etc.). Antes de
> alterar configuração de build, roteamento ou cache, consulte
> `node_modules/next/dist/docs/` — é a documentação da versão realmente
> instalada neste projeto.

## Árvore de pastas

```
supabase/
  migrations/                 # SQL versionado, aplicado via Supabase MCP (apply_migration)
src/
  proxy.ts                    # Refresh de sessão Supabase em toda requisição (substitui middleware.ts no Next 16)
  app/
    layout.tsx                 # Layout raiz: só <html>/<body>, fontes, script de tema — sem chrome de UI
    globals.css
    (marketing)/
      layout.tsx                 # SiteShell (Header + Footer públicos)
      page.tsx                    # Home pública: vitrine do Design System
    (auth)/
      layout.tsx                  # Shell mínimo centralizado, sem nav
      login/page.tsx
      cadastro/page.tsx
    auth/confirm/route.ts         # Callback do link de confirmação de e-mail (Route Handler, não é página)
    onboarding/page.tsx            # Cria a primeira empresa do usuário (ou uma empresa adicional)
    api/                            # Route Handlers técnicos (não são páginas — ver "Route Handlers" abaixo)
      agente-impressao/trabalhos/route.ts        # GET: agente local consulta jobs pendentes (Bearer da chave própria)
      agente-impressao/trabalhos/[id]/route.ts    # PATCH: agente reporta status do job
      relatorios/[tipo]/route.ts                   # GET: exportação CSV (?formato=pdf ainda retorna 501)
      webhooks/[provedor]/route.ts                  # POST: inbox de webhook de integração (iFood/99Food/Keeta/Open Delivery)
    (app)/
      layout.tsx                   # DAL: exige sessão + resolve empresa ativa; renderiza AppHeader
      fichas-tecnicas/
        page.tsx                    # Listagem: busca + filtro + paginação
        nova/page.tsx
        [id]/page.tsx                 # Visualização + impressão/exportar PDF + duplicar
        [id]/editar/page.tsx
        [id]/versoes/page.tsx          # Histórico de versões
      ingredientes/page.tsx           # CRUD: busca + filtro por categoria/status + paginação
      categorias/page.tsx              # CRUD simples
      unidades-medida/page.tsx          # CRUD simples (linhas de sistema são somente leitura)
      estoque/
        page.tsx                        # Dashboard: saldo por ingrediente + alertas (mínimo/validade)
        movimentacoes/page.tsx           # Ledger completo (busca + filtro por tipo + paginação)
        lotes/page.tsx                    # Lotes ativos, ordenados por validade (FIFO)
        inventarios/page.tsx               # Histórico de contagens físicas
        inventarios/[id]/page.tsx           # Contagem (editável) ou resumo (concluído)
      compras/
        page.tsx                        # Redireciona para /compras/pedidos
        fornecedores/page.tsx            # CRUD simples
        solicitacoes/page.tsx             # Lista + filtro por status
        solicitacoes/nova/page.tsx
        solicitacoes/[id]/page.tsx         # Aprovar/rejeitar/converter em pedido
        pedidos/page.tsx                  # Lista + filtro por status
        pedidos/novo/page.tsx
        pedidos/[id]/page.tsx              # Recebimento por item (gera lote de estoque)
        precos/page.tsx                    # Comparativo de preços por fornecedor
      producao/page.tsx                 # Visão dia/semana (query params), consumo previsto, necessidade de compra
      lista-compras/page.tsx             # Histórico de listas geradas
      lista-compras/[id]/page.tsx         # Itens editáveis, agrupado por fornecedor, converter em pedidos
      financeiro/
        page.tsx                          # Redireciona para /financeiro/painel
        painel/page.tsx                    # "Nunca no Vermelho": semáforo + resumo + alertas (próprios + de outros módulos)
        precificacao/page.tsx               # Margem real por ficha + preço/margem por canal de venda
        ponto-equilibrio/page.tsx            # Receita necessária no geral e por produto
        metas-vendas/page.tsx                # CRUD de metas de faturamento mensal
        custos-fixos/page.tsx                # CRUD de despesas recorrentes
        custos-variaveis/page.tsx            # CRUD de custos por venda (cartão, embalagem — qualquer canal)
        canais/page.tsx                      # CRUD de canais de venda (iFood, 99Food, Keeta, Delivery Próprio, personalizados)
        simulador-promocoes/page.tsx         # Impacto de desconto na margem, por canal opcional
      dashboard/page.tsx                  # KPIs realizados/projetados, meta vs realizado, alertas, produtos/canal — filtro de período+canal
      vendas/page.tsx                     # Registro de vendas: única fonte de "realizado" do sistema
      clientes/
        page.tsx                            # CRM: listagem + busca + paginação
        [id]/page.tsx                        # Detalhe: estatísticas + histórico de pedidos (derivados de vendas)
      relatorios/page.tsx                 # 8 relatórios (seletor por tipo) + exportação CSV
      estoque/etiquetas/page.tsx           # Emissão de etiqueta de validade + fila de impressão + agentes locais
      integracoes/page.tsx                # iFood/99Food/Keeta/Open Delivery: status, credenciais (estrutura, sem chamada real)
  integrations/                  # Adapters de integração externa — interface comum, nenhum chama API real (ver docs/DATABASE.md)
    types.ts                        # IntegracaoAdapter, ProvedorIntegracao, IntegracaoNaoDisponivelError
    registry.ts                     # obterAdapter(provedor)
    ifood/adapter.ts, 99food/adapter.ts, keeta/adapter.ts, open-delivery/adapter.ts
  features/                    # Um módulo de domínio por pasta
    auth/{actions.ts, validation.ts, components/}
    empresa/{actions.ts, validation.ts, types.ts, components/}
    unidades-medida/{queries.ts, actions.ts, validation.ts, types.ts, components/}
    categorias-ingredientes/{queries.ts, actions.ts, validation.ts, components/}
    ingredientes/{queries.ts, actions.ts, validation.ts, components/}
    fichas-tecnicas/
      queries.ts, actions.ts, validation.ts, types.ts
      calculations.ts            # Fórmulas de CMV/margem/markup — espelha as funções SQL (ver docs/DATABASE.md)
      components/                 # Form com itens dinâmicos, painel de cálculo, tabela, versões...
    estoque/{queries.ts, actions.ts, validation.ts, types.ts, components/}
    fornecedores/{queries.ts, actions.ts, validation.ts, components/}
    compras/{queries.ts, actions.ts, validation.ts, types.ts, components/}
    producao/
      queries.ts, actions.ts, validation.ts
      date-range.ts               # Cálculo de semana (segunda–domingo) e navegação de datas — sem libs externas
      components/
    lista-compras/{queries.ts, actions.ts, components/}
    financeiro/
      queries.ts, actions.ts, validation.ts
      calculations.ts             # Margem real, preço por margem-alvo, ponto de equilíbrio, análise de fichas em alerta — combina, não duplica, as fórmulas de fichas-tecnicas/calculations.ts
      components/                 # Managers de custos fixos/variáveis/canais, painel, precificação (geral + por canal), simulador
    vendas/{queries.ts, actions.ts, validation.ts, components/}
    clientes/{queries.ts, actions.ts, validation.ts, components/}
    dashboard/
      calculations.ts             # analisarVendas() — agrega vendas do período reusando calcularMargemContribuicaoReal do Financeiro; sem query própria de banco
      components/
    relatorios/
      queries.ts                  # Uma função por relatório sem correspondente direto em outro módulo (vendas, compras) — o resto reusa queries existentes
      csv.ts                       # gerarCsv() puro, sem lib externa
      components/
    etiquetas/
      queries.ts, actions.ts, validation.ts
      agente-auth.ts               # Valida o Bearer do agente local contra agentes_impressao.chave_api_hash
      components/                  # Emissão + preview + histórico + gestão de agentes locais
    integracoes/
      queries.ts, actions.ts, validation.ts
      crypto.ts                    # AES-256-GCM para credenciais (chave em INTEGRACOES_SECRET_KEY, nunca no banco)
      components/
  server/
    auth/
      dal.ts                       # verifySession() com React cache() — única fonte de verdade de "quem está logado"
      get-empresa-atual.ts          # Resolve a empresa ativa (cookie) entre as empresas do usuário
  lib/
    supabase/{client.ts, server.ts, database.types.ts}
    supabase/service-role.ts        # Client com service-role (bypassa RLS) — só para Route Handlers sem sessão Supabase Auth (agente local, webhooks)
    utils.ts                        # cn() — combina/mescla classes Tailwind
    fonts.ts                         # Fontes (next/font) centralizadas
    format.ts                        # Intl.NumberFormat/DateTimeFormat pt-BR compartilhados (moeda, decimal, %, data)
    periodo.ts                       # Primeiro/último dia do mês corrente — período padrão de Dashboard/Relatórios
  hooks/
    use-debounced-value.ts
  types/
    pagination.ts                    # PaginatedResult<T>, PaginationParams — compartilhado entre features
  styles/
    tokens.css                        # Tokens de design (cor, raio) e tema claro/escuro
  components/
    ui/                                # Design System — ver docs/COMPONENTS.md
    layout/
      header,footer,site-shell,app-header,empresa-switcher.tsx
      module-sub-nav.tsx                # Sub-navegação de um módulo (Estoque, Compras) baseada na rota atual
docs/                                   # Esta documentação
```

### Convenções de rota (App Router)

- Cada pasta em `app/` é um segmento de URL; só vira rota pública com um
  `page.tsx`. Route groups `(nome)` organizam sem afetar a URL — usados aqui
  para dar layouts diferentes a três áreas do site: `(marketing)` (pública,
  com Header/Footer), `(auth)` (login/cadastro, shell mínimo) e `(app)`
  (autenticada, com `AppHeader` e navegação entre módulos).
- Componentes de UI genéricos (não amarrados a uma rota específica) vivem em
  `src/components`, fora de `app/`, para reforçar a separação entre roteamento
  e apresentação.
- Por padrão, todo componente é **Server Component**. Use `'use client'`
  apenas quando o componente precisa de interatividade no navegador (estado,
  efeitos, event handlers).
- Alias de import `@/*` aponta para `src/*` (configurado em `tsconfig.json`).

### Autenticação e multi-empresa

- Supabase Auth (email/senha) via `@supabase/ssr`. `src/proxy.ts` refresca a
  sessão em toda requisição; `src/server/auth/dal.ts` (`verifySession()`) é a
  única fonte de verdade sobre "quem está logado" no servidor — sempre
  redireciona para `/login` se não houver sessão, nunca retorna usuário nulo
  silenciosamente.
- Um usuário pode ter **múltiplas empresas**. A "empresa ativa" da
  requisição é resolvida por `src/server/auth/get-empresa-atual.ts`: lê o
  cookie `empresa_ativa_id`, valida que pertence ao usuário, e cai para a
  primeira empresa cadastrada se o cookie estiver ausente/inválido. Trocar de
  empresa (`EmpresaSwitcher`) só regrava o cookie e redireciona — não há
  tabela de "sessão de empresa" no banco.
- `(app)/layout.tsx` é o único lugar que decide "sem empresa → `/onboarding`"
  — as páginas de feature (fichas técnicas, ingredientes, etc.) assumem que
  já existe uma empresa ativa.

### Padrão de escrita de dados

- CRUDs simples (unidades de medida, categorias, ingredientes, empresa) usam
  Server Actions clássicas com `useActionState` + `<form action={...}>` +
  `FormData`.
- **Ficha técnica é a exceção deliberada**: como o formulário tem uma lista
  dinâmica de itens (ilimitados) com painel de cálculo ao vivo, ele mantém
  todo o estado (metadados + itens) em React state no cliente e chama a
  Server Action `salvarFichaTecnica` **diretamente** (não via `<form
action>`), passando um objeto tipado. A Server Action, por sua vez, chama a
  função Postgres `salvar_ficha_tecnica` via `supabase.rpc(...)` — que
  substitui a ficha + todos os itens numa única transação atômica e gera uma
  nova versão. Ver `docs/DATABASE.md`.

### Padrão de sub-navegação de módulo

Módulos com mais de uma tela relacionada (Estoque, Compras, Financeiro) usam
`ModuleSubNav` (`src/components/layout/module-sub-nav.tsx`): um componente
genérico que recebe uma lista de `{ href, label }` e destaca o link ativo
comparando com `usePathname()` — mesmo visual do `Tabs`, mas navegando entre
páginas de verdade (cada aba é uma URL própria, com seus próprios
`searchParams` de busca/filtro/paginação). Cada módulo declara sua lista em
`src/features/<modulo>/components/<modulo>-sub-nav-links.ts`. Planejamento de
Produção, por ter só uma página, usa `Tabs` (client-side, sem URLs
separadas) em vez de `ModuleSubNav`.

### Route Handlers e autenticação sem sessão (Sprint 04)

`src/app/auth/confirm/route.ts` já estabelecia o padrão: Route Handler fora
de qualquer route group quando o endpoint é técnico, não uma página. A
Sprint 04 adicionou o primeiro caso de **chamador sem sessão Supabase
Auth**: o agente local de impressão (processo headless no Windows) e um
provedor de integração externo batendo no webhook não têm cookie de
usuário nenhum. Para esses dois casos:

- A Route Handler usa `src/lib/supabase/service-role.ts`
  (`createServiceRoleClient()`), que bypassa RLS por completo — igual a uma
  função `SECURITY DEFINER` no banco.
- Por isso, **a checagem de posse é sempre manual e explícita** logo no
  início do handler — mesma convenção de toda função `SECURITY DEFINER` do
  projeto (ver `docs/DATABASE.md`). Para o agente: valida o `Bearer` da
  chave contra `agentes_impressao.chave_api_hash`
  (`src/features/etiquetas/agente-auth.ts`) e só então filtra por
  `empresa_id` do agente autenticado. Para o webhook: não há usuário para
  validar (é o provedor externo chamando), então o handler só registra em
  `integracoes_webhooks_recebidos` — nenhuma escrita em tabela
  multiempresa sem confirmar de qual empresa é o dado.
- **Nunca** use `createServiceRoleClient()` fora desses dois casos — toda
  outra Route Handler/Server Action/Server Component usa
  `src/lib/supabase/server.ts` (client normal, respeita RLS via a sessão do
  cookie).

## Pontos de extensão futuros

Controle de Estoque, Compras, Planejamento de Produção e Lista Inteligente de
Compras foram implementados na Sprint 02; Precificação, custeio completo
(custos fixos/variáveis, canais de venda), Ponto de Equilíbrio, Metas de
Vendas, Simulador de Promoções e Painel "Nunca no Vermelho" foram
implementados na Sprint 03; Dashboard Executivo, Relatórios Gerenciais, CRM
de Clientes, Vendas, Etiquetas de Validade + Fila de Impressão e a
**estrutura** de Integrações foram implementados na Sprint 04 (ver árvore
acima, `docs/DATABASE.md` e `docs/SPRINT-04.md`). Restam:

| Pendência                                    | Propósito                                                                                                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chamadas reais em `src/integrations/*`        | Os 4 adapters (iFood, 99Food, Keeta, Open Delivery) existem como esqueleto (`IntegracaoAdapter`) mas todo método lança `IntegracaoNaoDisponivelError` — implementar de verdade requer credenciais de parceiro homologado com cada provedor, que este projeto não tem. |
| Executável do agente local                    | O contrato da API está pronto e documentado (`docs/AGENTE-LOCAL.md`), mas o processo/serviço Windows que efetivamente imprime na térmica não foi construído nesta sprint.                                                          |
| Exportação em PDF                             | `/api/relatorios/[tipo]?formato=pdf` já existe na assinatura e retorna 501 — geração real de PDF fica para uma sprint futura.                                                                                                       |
| PDVs, ERPs, impressoras térmicas (adapters)    | Mesma lógica dos adapters de delivery — reserva de nome, sem implementação real.                                                                                                                                                     |
| Custos de funcionários, relatórios de RH       | Ainda fora de escopo — ver [PRODUCT-VISION.md](./PRODUCT-VISION.md).                                                                                                                                                                 |

Quando uma dessas pendências for resolvida, atualize esta tabela.
