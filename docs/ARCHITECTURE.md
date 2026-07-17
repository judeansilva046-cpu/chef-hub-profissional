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
      calculations.ts             # Margem real, preço por margem-alvo, ponto de equilíbrio — combina, não duplica, as fórmulas de fichas-tecnicas/calculations.ts
      components/                 # Managers de custos fixos/variáveis/canais, painel, precificação (geral + por canal), simulador
  server/
    auth/
      dal.ts                       # verifySession() com React cache() — única fonte de verdade de "quem está logado"
      get-empresa-atual.ts          # Resolve a empresa ativa (cookie) entre as empresas do usuário
  lib/
    supabase/{client.ts, server.ts, database.types.ts}
    utils.ts                        # cn() — combina/mescla classes Tailwind
    fonts.ts                         # Fontes (next/font) centralizadas
    format.ts                        # Intl.NumberFormat/DateTimeFormat pt-BR compartilhados (moeda, decimal, %, data)
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

## Pontos de extensão futuros

Controle de Estoque, Compras, Planejamento de Produção e Lista Inteligente de
Compras foram implementados na Sprint 02; Precificação, custeio completo
(custos fixos/variáveis, canais de venda), Ponto de Equilíbrio, Metas de
Vendas, Simulador de Promoções e Painel "Nunca no Vermelho" foram
implementados na Sprint 03 (`src/features/financeiro/*` — ver árvore acima e
`docs/DATABASE.md`). Restam como pastas **que ainda não existem**:

| Pasta futura        | Propósito                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/integrations/*` | Adaptadores para sistemas externos — iFood, 99Food, Keeta, Open Delivery, PDVs, ERPs e impressoras térmicas (integração de PEDIDOS/catálogo real; `canais_venda` no Financeiro só modela a TAXA de cada canal para precificação, não a integração). Cada integração deve implementar uma interface comum para não vazar detalhes de um provedor específico no resto do app. |
| custos de funcionários, relatórios gerenciais | Ainda fora de escopo — ver [PRODUCT-VISION.md](./PRODUCT-VISION.md). Quando entrarem, seguem o mesmo padrão de `src/features/financeiro/*`.                                                                    |

Quando uma dessas pastas for criada, atualize esta tabela.
