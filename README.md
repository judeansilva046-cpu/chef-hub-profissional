# Chef Hub Profissional

Plataforma SaaS de gestão inteligente para restaurantes, delivery, dark
kitchens, padarias, confeitarias, cafeterias e pequenos produtores de
alimentos — foco em precificação, fichas técnicas, estoque, CMV, margem de
contribuição, pedidos/PDV e decisões baseadas em dados.

> **Estado atual: Sprints 01–05.** Fundação (Design System, auth,
> multi-empresa), operacional (fichas, estoque, compras, produção),
> financeiro, dashboard/CRM/relatórios/etiquetas/integrações (estrutura), e
> núcleo de sala (pedidos, PDV, KDS, caixa, mesas, expedição). Ver
> [docs/PRODUCT-VISION.md](./docs/PRODUCT-VISION.md) e a
> [auditoria completa](./docs/AUDITORIA.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Auth) · Zod · Playwright (e2e)

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha as chaves Supabase
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
| `npm test`             | Testes unitários (Vitest)                |
| `npm run test:e2e`     | Testes e2e (Playwright)                  |

## Documentação

Toda a documentação técnica está em [`docs/`](./docs/README.md):

- [Visão do produto](./docs/PRODUCT-VISION.md)
- [Arquitetura](./docs/ARCHITECTURE.md)
- [Banco de dados](./docs/DATABASE.md)
- [Design System](./docs/DESIGN-SYSTEM.md)
- [Componentes](./docs/COMPONENTS.md)
- [Padrões de código](./docs/CODING-STANDARDS.md)
- [Sprint 04](./docs/SPRINT-04.md)
- [Agente local de impressão](./docs/AGENTE-LOCAL.md)
- [Auditoria completa](./docs/AUDITORIA.md)
