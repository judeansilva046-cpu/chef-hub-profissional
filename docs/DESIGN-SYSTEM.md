# Design System

Fonte de verdade dos tokens visuais do Chef Hub Profissional. Implementado em
`src/styles/tokens.css` e consumido via utilitários Tailwind gerados pelo
bloco `@theme inline`.

## Cor

Todas as cores são **semânticas** (nunca use `bg-orange-600` diretamente em
uma feature — use o token). Cada token tem um par `light`/`dark`, trocado via
atributo `data-theme` em `<html>` (ver [Tema claro/escuro](#tema-claroescuro)).

| Token                                | Uso                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `background` / `foreground`          | Fundo e texto padrão da página                                                  |
| `card` / `card-foreground`           | Fundo e texto de blocos elevados (`Card`)                                       |
| `border` / `input`                   | Bordas de containers e campos de formulário                                     |
| `ring`                               | Anel de foco (acessibilidade de teclado)                                        |
| `primary` / `primary-foreground`     | Cor de marca — ações principais                                                 |
| `secondary` / `secondary-foreground` | Ações e superfícies secundárias                                                 |
| `muted` / `muted-foreground`         | Texto e superfícies de menor ênfase                                             |
| `accent` / `accent-foreground`       | Destaques sutis                                                                 |
| `success` / `success-foreground`     | Estados positivos — reservado para indicadores futuros de lucro/margem saudável |
| `warning` / `warning-foreground`     | Atenção — ex. estoque baixo, validade próxima                                   |
| `danger` / `danger-foreground`       | Erros e estados negativos — ex. operação no prejuízo                            |
| `info` / `info-foreground`           | Informativo neutro                                                              |

Uso em Tailwind: `bg-primary`, `text-primary-foreground`, `border-border`,
etc. — funcionam porque `@theme inline` mapeia cada variável para
`--color-*`.

## Tipografia

Usamos a **escala padrão do Tailwind v4** (`text-xs` a `text-4xl`) com as
fontes [Geist Sans](https://vercel.com/font) (texto) e Geist Mono
(monoespaçada), carregadas via `next/font` em `src/lib/fonts.ts` e expostas
como `font-sans` / `font-mono`. Não reinventamos uma escala tipográfica
paralela — ver a vitrine em `/` para os tamanhos em uso.

Componentes `Heading` (níveis 1–4) e `Text` (tamanhos `sm`/`base`/`lg`, tom
`default`/`muted`) padronizam o uso dessa escala — ver
[COMPONENTS.md](./COMPONENTS.md).

## Espaçamento, raio e sombra

- **Espaçamento**: escala padrão do Tailwind v4 (múltiplos de 0.25rem).
- **Raio**: um único token `--radius` (0.625rem) gera `--radius-sm/md/lg/xl`
  no `@theme inline`, garantindo que todo arredondamento do produto derive de
  uma única fonte (evita, por exemplo, um card com `rounded-lg` e outro com
  `rounded-xl` escolhidos arbitrariamente).
- **Sombra**: escala padrão do Tailwind v4 (`shadow-sm`, `shadow-md`...).

## Tema claro/escuro

Mecanismo oficial recomendado pela documentação do Next.js 16
(`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`),
para evitar flash de tema errado antes da hidratação:

1. `app/layout.tsx` renderiza `<html data-theme="light" suppressHydrationWarning>`
   como padrão do servidor.
2. Um `<script>` inline no `<head>` roda de forma síncrona, **antes do
   primeiro paint**: lê `localStorage.theme`; se não houver valor salvo, usa
   `prefers-color-scheme`; e corrige o atributo `data-theme` imediatamente.
3. `src/styles/tokens.css` define os valores de cada token em `:root`
   (claro) e `[data-theme="dark"]` (escuro).
4. O componente `ThemeToggle` (`src/components/ui/theme-toggle.tsx`) alterna
   o atributo `data-theme` e persiste a escolha em `localStorage` — sem usar
   estado React, para nunca divergir entre servidor e cliente. Os ícones de
   sol/lua são alternados por CSS puro (`[data-theme] [data-icon]` em
   `globals.css`), não por lógica condicional em JS.

Nunca usar `@media (prefers-color-scheme: dark)` como único mecanismo — ele
não respeita a preferência salva pelo usuário no `ThemeToggle`.

## Ícones

[`lucide-react`](https://lucide.dev) — biblioteca leve de ícones SVG,
`tree-shakeable` (cada ícone é importado individualmente).

## Utilitário de classes

`cn()` (`src/lib/utils.ts`) combina `clsx` (classes condicionais) com
`tailwind-merge` (resolve conflitos entre utilitários Tailwind, ex.:
`cn("p-4", condition && "p-6")` resulta em só um `padding`). Todo componente
que aceita `className` deve usar `cn()` para mesclar a classe recebida com as
classes internas.
