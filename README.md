# Chef Hub Profissional

Plataforma SaaS e PWA de gestão inteligente para restaurantes, delivery, dark
kitchens, padarias, confeitarias, cafeterias e pequenos produtores de
alimentos — foco em precificação, fichas técnicas, estoque, CMV, margem de
contribuição e decisões baseadas em dados.

> **Estado atual: fundação (Sprint 01).** Documentação, arquitetura de
> pastas, Design System, tema claro/escuro, layout base e componentes de UI
> reutilizáveis. Nenhuma funcionalidade de negócio foi implementada ainda —
> ver [docs/PRODUCT-VISION.md](./docs/PRODUCT-VISION.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3010](http://localhost:3010).

> O projeto usa a porta **3010** (não a 3000, padrão do Next.js) — já
> configurada nos scripts `dev` e `start` do `package.json`.

## Scripts

| Script                 | Descrição                                |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento (Turbopack)  |
| `npm run build`        | Build de produção                        |
| `npm run start`        | Serve o build de produção                |
| `npm run lint`         | ESLint                                   |
| `npm run typecheck`    | Verificação de tipos (`tsc --noEmit`)    |
| `npm run format`       | Formata o projeto com Prettier           |
| `npm run format:check` | Verifica formatação sem alterar arquivos |

## Documentação

Toda a documentação técnica está em [`docs/`](./docs/README.md):

- [Visão do produto](./docs/PRODUCT-VISION.md)
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Design System](./docs/DESIGN-SYSTEM.md)
- [Componentes](./docs/COMPONENTS.md)
- [Padrões de código](./docs/CODING-STANDARDS.md)
