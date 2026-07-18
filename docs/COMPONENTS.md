# Inventário de Componentes

Todos os componentes de `src/components/ui` são exportados também pelo
barrel `src/components/ui/index.ts` — prefira
`import { Button, Card } from "@/components/ui"` a importar arquivo por
arquivo.

## `src/components/ui`

| Componente                                                                                                                    | Arquivo            | Variantes / Props relevantes                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                                                      | `button.tsx`       | `variant`: `primary` \| `secondary` \| `outline` \| `ghost` \| `destructive`. `size`: `sm` \| `md` \| `lg`.                                                                                                                           |
| `Badge`                                                                                                                       | `badge.tsx`        | `variant`: `default` \| `success` \| `warning` \| `danger` \| `info` \| `outline`.                                                                                                                                                    |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`                                             | `card.tsx`         | Componente composto — combine as partes conforme necessário.                                                                                                                                                                          |
| `Input`                                                                                                                       | `input.tsx`        | `InputHTMLAttributes` padrão do HTML. Apenas estrutura/estilo — sem validação.                                                                                                                                                        |
| `Textarea`                                                                                                                    | `textarea.tsx`     | `TextareaHTMLAttributes` padrão.                                                                                                                                                                                                      |
| `Label`                                                                                                                       | `label.tsx`        | `LabelHTMLAttributes` padrão. Use com `htmlFor` apontando para o `id` do campo.                                                                                                                                                       |
| `Select`                                                                                                                      | `select.tsx`       | `SelectHTMLAttributes` padrão (nativo — melhor suporte mobile/acessibilidade que um dropdown custom para listas simples).                                                                                                             |
| `Separator`                                                                                                                   | `separator.tsx`    | `orientation`: `horizontal` \| `vertical`.                                                                                                                                                                                            |
| `Container`                                                                                                                   | `container.tsx`    | Largura máxima + padding horizontal responsivo. Envolve o conteúdo de cada `Section`.                                                                                                                                                 |
| `Section`                                                                                                                     | `section.tsx`      | Espaçamento vertical padrão entre blocos de página.                                                                                                                                                                                   |
| `Heading`                                                                                                                     | `heading.tsx`      | `level`: `1` \| `2` \| `3` \| `4` (define tamanho); `as` sobrescreve a tag HTML sem mudar o tamanho visual.                                                                                                                           |
| `Text`                                                                                                                        | `text.tsx`         | `size`: `sm` \| `base` \| `lg`. `tone`: `default` \| `muted` \| `danger` \| `success` \| `warning` \| `info`. `weight`: `normal` \| `medium` \| `semibold`. `as`: `p` \| `span`.                                                      |
| `ThemeToggle`                                                                                                                 | `theme-toggle.tsx` | Sem props de variante. Client Component — ver [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md#tema-claroescuro).                                                                                                                                |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`                                                     | `table.tsx`        | Componente composto para listagens; `Table` já embrulha em container com scroll horizontal.                                                                                                                                           |
| `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` | `dialog.tsx`       | Baseado em `@radix-ui/react-dialog` (focus trap, portal, ARIA corretos) — visual 100% via `cva`/tokens do projeto. Usado para CRUD em modal (ingredientes, categorias, unidades).                                                     |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`                                                                              | `tabs.tsx`         | Baseado em `@radix-ui/react-tabs`. Usado na ficha técnica (Detalhes / Histórico de versões).                                                                                                                                          |
| `Pagination`                                                                                                                  | `pagination.tsx`   | Server Component. Props: `page`, `totalPages`, `createHref(page): string` (você decide como montar a URL, preservando busca/filtros).                                                                                                 |
| `EmptyState`                                                                                                                  | `empty-state.tsx`  | Props: `icon?` (ícone `lucide-react`), `title`, `description?`, `action?`.                                                                                                                                                            |
| `Combobox`                                                                                                                    | `combobox.tsx`     | Baseado em `@radix-ui/react-popover` + `cmdk` (busca com filtro). Props: `options: {value,label,description?}[]`, `value`, `onValueChange`, `name?` (hidden input para FormData). Usado para selecionar ingrediente na ficha técnica. |
| `NumberField`, `CurrencyInput`, `PercentInput`                                                                                | `number-field.tsx` | Campo numérico formatado em pt-BR (`Intl.NumberFormat`, sem lib de máscara) — texto puro editável quando focado, formatado no blur. Props: `value: number \| null`, `onChange`, `kind?`, `name?` (hidden input para FormData).        |
| `SearchInput`                                                                                                                 | `search-input.tsx` | Client Component: sincroniza com a URL (`?busca=...`) via `next/navigation`, debounced (300ms), sempre reseta `page`.                                                                                                                 |
| `Skeleton`                                                                                                                    | `skeleton.tsx`     | Bloco `animate-pulse` para estados de carregamento (`loading.tsx`).                                                                                                                                                                   |

## `src/components/layout`

| Componente        | Arquivo                | Propósito                                                                                                                                     |
| ----------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header`          | `header.tsx`           | Cabeçalho da área pública (`(marketing)`): nome do produto + `ThemeToggle`.                                                                   |
| `Footer`          | `footer.tsx`           | Rodapé da área pública, com copyright.                                                                                                        |
| `SiteShell`       | `site-shell.tsx`       | Compõe `Header` + `{children}` + `Footer` — usado em `app/(marketing)/layout.tsx`.                                                            |
| `AppHeader`       | `app-header.tsx`       | Cabeçalho da área autenticada (`(app)`): nome do produto, navegação entre módulos, `EmpresaSwitcher`, `ThemeToggle`, logout.                  |
| `EmpresaSwitcher` | `empresa-switcher.tsx` | Client Component: troca a empresa ativa (cookie `empresa_ativa_id`, ver `docs/DATABASE.md`) ou navega para `/onboarding` para criar uma nova. |

## Padrão de construção

- Componentes com variantes visuais usam
  [`class-variance-authority`](https://cva.style) (`cva`) para tipar as
  combinações possíveis de `variant`/`size` — ver `button.tsx` ou `badge.tsx`
  como referência.
- Componentes que envolvem primitivas do [Radix UI](https://radix-ui.com)
  (`Dialog`, `Tabs`, `Combobox`) só usam o Radix como motor de
  comportamento/acessibilidade — toda a estilização vem de `cn()` + tokens do
  Design System, nunca de CSS do próprio Radix. Visualmente são
  indistinguíveis de um componente 100% autoral.
- Todo componente aceita e mescla `className` via `cn()` (ver
  [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md#utilitário-de-classes)).
- Componentes que encapsulam um elemento HTML nativo (`Button`, `Input`,
  `Select`, `Textarea`) estendem o respectivo `*HTMLAttributes` e usam
  `forwardRef`.
- `NumberField` e `Combobox` aceitam uma prop opcional `name`: quando
  informada, renderizam um `<input type="hidden">` espelhando o valor cru
  (não formatado/exibido) — permite que apareçam dentro de um
  `<form action={serverAction}>` comum e sejam lidos via `FormData.get(name)`
  no servidor, mesmo tendo um controle visual mais rico que um `<input>`
  nativo.

## Próximos componentes prováveis (não construídos nesta sprint)

`Toast`, `DropdownMenu`, `Tooltip` — nenhum fluxo desta sprint exige: erros
e sucesso de Server Action usam `useActionState` + mensagem inline via
`Text tone="danger"`.
