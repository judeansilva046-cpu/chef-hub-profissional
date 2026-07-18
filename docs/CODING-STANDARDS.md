# Padrões de Código

## TypeScript

- `strict: true` (já configurado em `tsconfig.json`) — não desabilite regras
  de tipo para "resolver rápido" um erro; corrija o tipo.
- Nunca use `any` implícito. Se um tipo é genuinamente desconhecido, use
  `unknown` e faça o narrowing explícito.
- Exporte `interface`/`type` de props junto do componente que os usa (ex.:
  `ButtonProps` em `button.tsx`), não em um arquivo de tipos central — só
  centralize em `src/types` quando o tipo for consumido por múltiplas
  features (ver [ARCHITECTURE.md](./ARCHITECTURE.md#pontos-de-extensão-futuros)).

## Componentes React

- **Server Component por padrão.** Só adicione `'use client'` quando o
  componente precisar de `useState`, `useEffect`, event handlers ou APIs de
  navegador. Coloque a diretiva no arquivo mais específico possível (o
  componente interativo em si, não a página inteira).
- Um componente por arquivo; nome do arquivo em `kebab-case`
  (`theme-toggle.tsx`), nome do componente em `PascalCase` (`ThemeToggle`).
- Componentes que envolvem um elemento HTML nativo devem aceitar `className`
  e mesclá-lo por último com `cn()`, para que o consumidor sempre consiga
  sobrescrever estilo.
- Prefira composição (`Card` + `CardHeader` + `CardContent`) a props booleanas
  que ligam/desligam blocos inteiros de UI.

## Estilos

- Tailwind utilitário é o padrão. CSS solto só em `globals.css` (reset/base)
  e `tokens.css` (variáveis) — não crie novos arquivos `.css` para estilizar
  um componente específico sem necessidade real (ex.: seletor que o Tailwind
  não expressa).
- Nunca use valores de cor "crus" (`#f97316`, `bg-orange-600`) fora de
  `tokens.css`. Use os tokens semânticos (`bg-primary`, `text-danger`) — ver
  [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

## Imports

- Use o alias `@/*` para tudo dentro de `src/` (nunca `../../../`).
- Ordem: (1) módulos externos (`react`, `next`, pacotes npm), linha em
  branco, (2) módulos internos (`@/...`), linha em branco, (3) imports
  relativos/estilos locais. O Prettier + ESLint não reordenam import
  automaticamente — mantenha a ordem manualmente ao adicionar imports.

## Formatação e lint

- `npm run format` (Prettier, com `prettier-plugin-tailwindcss` ordenando
  classes automaticamente) antes de commitar.
- `npm run lint` (ESLint) e `npm run typecheck` (`tsc --noEmit`) devem passar
  sem erros antes de qualquer PR.
- `eslint-config-prettier` está habilitado — o ESLint não entra em conflito
  com o Prettier em regras de formatação; se um erro de lint aparecer, é uma
  questão de código, não de estilo.

## Commits

Convenção [Conventional Commits](https://www.conventionalcommits.org/):
`tipo(escopo opcional): descrição no imperativo`.

Tipos usados no projeto: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`,
`test`. Exemplo: `feat(design-system): adicionar componente Badge`.

## Acessibilidade (checklist mínimo)

- Todo elemento interativo (`button`, `input`) precisa ser alcançável por
  teclado e ter estado de foco visível — os componentes base já aplicam
  `focus-visible:ring-2 focus-visible:ring-ring`, não remova.
- Ícones sem texto ao lado precisam de `aria-label` (ver `ThemeToggle`) ou de
  um `<span className="sr-only">` com o texto equivalente.
- Contraste de cor: os tokens semânticos já foram escolhidos para atender
  contraste AA em ambos os temas — não crie combinações texto/fundo fora dos
  pares `token`/`token-foreground` definidos.
