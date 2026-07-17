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
- [ ] Etiquetas de validade
- [x] Planejamento de produção
- [x] Lista de compras inteligente
- [ ] Calculadora completa de custos de funcionários
- [ ] Gestão de custos fixos e variáveis
- [ ] Ponto de equilíbrio
- [ ] Sugestão de metas mínimas de vendas para nunca operar no prejuízo
- [ ] Relatórios gerenciais

## Princípio de produto

O sistema deve ser **extremamente simples de utilizar**, mesmo cobrindo
domínios complexos de gestão financeira e operacional, mas com **arquitetura
corporativa** preparada para escalar em volume de dados, usuários e módulos.

## Escopo da primeira versão

A primeira versão **não terá** integração com marketplaces ou sistemas
externos. Toda a arquitetura, no entanto, deve ficar preparada para receber
futuramente:

- iFood
- 99Food
- Keeta
- Open Delivery
- PDVs (Pontos de Venda)
- ERPs
- Impressoras térmicas

Essas integrações são tratadas como **pontos de extensão documentados** em
[ARCHITECTURE.md](./ARCHITECTURE.md#pontos-de-extensão-futuros), não como
código existente.

## Estado atual

- **Sprint 01**: fundação — documentação, arquitetura de pastas, Design
  System, tema claro/escuro, layout base e componentes de UI reutilizáveis.
- **Sprint 02**: Controle de Estoque (FIFO), Compras (fornecedores,
  solicitações, pedidos), Planejamento de Produção e Lista Inteligente de
  Compras — banco de dados real (Supabase), autenticação (email/senha),
  multi-empresa, e CRUDs de apoio (ingredientes, categorias, unidades de
  medida). Ver [DATABASE.md](./DATABASE.md) para o schema e as fórmulas.
- Ainda não implementados: etiquetas de validade, custos de
  funcionários/fixos/variáveis, ponto de equilíbrio, relatórios gerenciais,
  e qualquer integração externa (iFood, PDVs, ERPs etc. — ver
  [ARCHITECTURE.md](./ARCHITECTURE.md#pontos-de-extensão-futuros)).
