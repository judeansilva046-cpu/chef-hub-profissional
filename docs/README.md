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
- [AUDITORIA.md](./AUDITORIA.md) — auditoria completa (2026-07-21): estado
  real das Sprints 01–05, segurança, gaps e roadmap de remediação.

> **Nota (Sprint 05):** Pedidos, PDV, KDS, Caixa, Mesas e Expedição já
> existem no código (migrations `0030`–`0039`), mas ainda **não** há um
> `SPRINT-05.md` dedicado nem a árvore completa em ARCHITECTURE.md /
> DATABASE.md. Até essa documentação ser escrita, use
> [AUDITORIA.md](./AUDITORIA.md) como referência do estado real.

Cada sprint subsequente deve atualizar estes documentos conforme o sistema
evolui — eles são a fonte de verdade para decisões de arquitetura e design.
