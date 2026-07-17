# Visão do Produto

## O que é

O **Chef Hub Profissional** é uma plataforma **SaaS e PWA** de gestão
inteligente para negócios de food service: restaurantes, delivery, dark
kitchens, padarias, confeitarias, cafeterias e pequenos produtores de
alimentos.

## Objetivo central

Permitir que empresas do food service controlem completamente seus custos e
tomem decisões baseadas em dados — vender com lucro, controlar desperdícios e
aumentar a eficiência operacional.

## Pilares funcionais

- [x] **Fichas técnicas** — módulo principal, com cálculo automático de CMV,
      margem de contribuição, markup, preço sugerido, versionamento e duplicação
      (ver [DATABASE.md](./DATABASE.md))
- [x] **Controle de ingredientes** — cadastro, categorias, unidades de
      medida, histórico de preços
- [x] Precificação inteligente (preço sugerido por margem-alvo)
- [x] Cálculo de CMV (Custo da Mercadoria Vendida) — a nível de item/ficha;
      CMV contábil período-a-período depende do pilar Controle de Estoque
- [x] Margem de contribuição
- [x] Markup
- [x] Controle de estoque
- [x] Etiquetas de validade — emissão, fila de impressão, agentes locais
      (impressão térmica real depende do executável do agente — ver
      [AGENTE-LOCAL.md](./AGENTE-LOCAL.md))
- [x] Planejamento de produção
- [x] Lista de compras inteligente
- [ ] Calculadora completa de custos de funcionários
- [x] Gestão de custos fixos e variáveis
- [x] Ponto de equilíbrio
- [x] Sugestão de metas mínimas de vendas para nunca operar no prejuízo
      (Metas de Vendas + Painel "Nunca no Vermelho")
- [x] Taxas configuráveis por canal de venda (iFood, 99Food, Keeta, Delivery
      Próprio, canais personalizados) e simulador de promoções
- [x] Relatórios gerenciais — vendas, CMV, margem, estoque, compras,
      produção, por produto, por canal; exportação CSV (PDF ainda não
      implementado)
- [x] Dashboard Executivo — faturamento projetado/realizado, CMV, margem,
      ponto de equilíbrio, meta vs. realizado, alertas, produtos mais/menos
      rentáveis, comparativo por canal
- [x] CRM de clientes — cadastro, histórico de pedidos, ticket médio,
      frequência, última compra, segmentação
- [x] Registro de vendas — a base transacional que faturamento realizado,
      CMV realizado e o CRM dependem
- [ ] Integrações reais com iFood/99Food/Keeta/Open Delivery — estrutura
      pronta (tabelas, adapters, credenciais cifradas, webhooks), nenhuma
      chamada real ainda (depende de credenciais de parceiro homologado)

## Princípio de produto

O sistema deve ser **extremamente simples de utilizar**, mesmo cobrindo
domínios complexos de gestão financeira e operacional, mas com **arquitetura
corporativa** preparada para escalar em volume de dados, usuários e módulos.

## Escopo da primeira versão

A primeira versão **não terá integração funcional** com marketplaces ou
sistemas externos. Desde a Sprint 04, a arquitetura para isso **existe em
código** (`src/integrations/*`, tabela `integracoes_canais`, webhooks) para:

- iFood
- 99Food
- Keeta
- Open Delivery
- PDVs (Pontos de Venda) — ainda só reserva de nome, sem adapter
- ERPs — ainda só reserva de nome, sem adapter
- Impressoras térmicas — fila de impressão + contrato do agente local
  prontos (ver [AGENTE-LOCAL.md](./AGENTE-LOCAL.md)); o executável do
  agente e a impressão física real ainda não existem

Mas **nenhuma chamada real a API de provedor externo acontece** — todo
adapter de delivery lança erro explícito quando invocado, porque isso
depende de credenciais de parceiro homologado que este projeto não tem.
Ver [ARCHITECTURE.md](./ARCHITECTURE.md#pontos-de-extensão-futuros).

## Estado atual

- **Sprint 01**: fundação — documentação, arquitetura de pastas, Design
  System, tema claro/escuro, layout base e componentes de UI reutilizáveis.
- **Sprint 02**: Controle de Estoque (FIFO), Compras (fornecedores,
  solicitações, pedidos), Planejamento de Produção e Lista Inteligente de
  Compras — banco de dados real (Supabase), autenticação (email/senha),
  multi-empresa, e CRUDs de apoio (ingredientes, categorias, unidades de
  medida). Ver [DATABASE.md](./DATABASE.md) para o schema e as fórmulas.
- **Sprint 03**: módulo Financeiro — Precificação (margem de contribuição
  real por ficha técnica e por canal de venda), taxas configuráveis de
  iFood/99Food/Keeta/Delivery Próprio/canais personalizados, Custos Fixos,
  Custos Variáveis, Ponto de Equilíbrio, Metas de Vendas, Simulador de
  Promoções e Painel "Nunca no Vermelho". Reaproveita 100% os dados de
  Ficha Técnica/Estoque/Compras/Produção já calculados — nenhuma tabela ou
  fórmula duplicada (ver [DATABASE.md](./DATABASE.md#sprint-03--financeiro-precificação-custeio-completo-e-canais-de-venda)).
- **Sprint 04**: Dashboard Executivo, Relatórios Gerenciais (8 tipos +
  exportação CSV), CRM de Clientes, registro de Vendas (base transacional
  nova — ver abaixo), Etiquetas de Validade + Fila de Impressão + contrato
  do agente local, e a estrutura (sem chamada real) de Integrações com
  iFood/99Food/Keeta/Open Delivery. Ver
  [DATABASE.md](./DATABASE.md#sprint-04--dashboard-relatórios-crm-etiquetas-e-integrações),
  [ARCHITECTURE.md](./ARCHITECTURE.md#pontos-de-extensão-futuros) e
  [SPRINT-04.md](./SPRINT-04.md).
- Ainda não implementados: calculadora completa de custos de funcionários,
  exportação de relatórios em PDF, chamadas reais de integração externa
  (iFood, 99Food, Keeta, Open Delivery, PDVs, ERPs) e o executável do
  agente local de impressão — ver
  [ARCHITECTURE.md](./ARCHITECTURE.md#pontos-de-extensão-futuros).
