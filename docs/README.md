# Documentação — Chef Hub Profissional

Índice da documentação técnica do projeto.

- [PRODUCT-VISION.md](./PRODUCT-VISION.md) — o que é o produto, para quem, e
  os pilares funcionais (o que já existe vs. o que ainda está planejado).
- [ARCHITECTURE.md](./ARCHITECTURE.md) — árvore de pastas, convenções de rota
  do App Router, autenticação/multi-empresa e onde módulos futuros vão
  entrar.
- [DATABASE.md](./DATABASE.md) — schema Supabase, RLS, e as fórmulas de CMV/
  margem de contribuição/markup usadas na Ficha Técnica.
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) — tokens de design (cor, tipografia,
  espaçamento, raio) e o mecanismo de tema claro/escuro.
- [COMPONENTS.md](./COMPONENTS.md) — inventário dos componentes reutilizáveis
  e suas variantes.
- [CODING-STANDARDS.md](./CODING-STANDARDS.md) — convenções de código,
  estrutura de componentes e commits.
- [AGENTE-LOCAL.md](./AGENTE-LOCAL.md) — contrato de API do agente local de
  impressão térmica (Sprint 04).
- [SPRINT-04.md](./SPRINT-04.md) — resumo da Sprint 04 (Dashboard,
  Relatórios, CRM, Etiquetas, Integrações): migrations, rotas e reuso.
- [SPRINT-05.md](./SPRINT-05.md) — Pedidos, PDV, KDS, Caixa, Mesas,
  Expedição + hardening de segurança (`0030`–`0041`).
- [AUDITORIA.md](./AUDITORIA.md) — auditoria completa + remediação.
- [AGENTE-LOCAL.md](./AGENTE-LOCAL.md) — contrato + CLI em `agents/impressao/`.
- [DEPLOY.md](./DEPLOY.md) — aplicar migrations `0040`–`0042`, smoke test e e2e.

Rotas novas pós-auditoria: `/financeiro/funcionarios`, PWA, PDF em
`/api/relatorios/[tipo]?formato=pdf`.

Cada sprint subsequente deve atualizar estes documentos conforme o sistema
evolui — eles são a fonte de verdade para decisões de arquitetura e design.
