# Sprint 05 — Pedidos, PDV, Caixa, Mesas, KDS e Expedição

Resumo do núcleo operacional de sala. Complementa
[AUDITORIA.md](./AUDITORIA.md) e as migrations `0030`–`0041`.

## Entregas

| Área | Rotas | Feature | Migrations |
| ---- | ----- | ------- | ---------- |
| Pedidos | `/pedidos`, `/pedidos/novo`, `/pedidos/[id]` | `features/pedidos` | `0030`, `0033`, `0034`, `0040` |
| PDV | `/pdv` (`(pos)`) | `pedidos/components/pdv-workspace` | + `fn_finalizar_venda_pdv` (`0040`) |
| Caixa / pagamentos | `/caixa`, `/caixa/[id]` | `features/caixa` | `0031`, `0032`, `0040` |
| Mesas / comandas | `/mesas`, `/mesas/[id]` | `features/mesas` | `0035` |
| KDS | `/kds` (`(pos)`) | `features/kds` | `0037`, `0040` (`status_preparo`), `0041` |
| Expedição | `/expedicao` | `features/expedicao` | `0036`, `0040` |
| Impressão de pedidos | fila + triggers | `features/impressao` | `0038` |
| Estoque ↔ pedido | referência `pedido` | — | `0039` |

## Regras de negócio importantes

1. **Baixa de estoque** ocorre em `fn_iniciar_preparo_pedido` (FIFO), não na
   conclusão. Cancelamento após preparo estorna via entrada `ajuste`.
2. **Vendas** (`vendas`) são criadas em `fn_concluir_pedido`. O registro
   manual em `/vendas` continua **sem** baixar estoque.
3. **Entrega/retirada** criam `expedicoes` ao ficarem `pronto`. Conclusão
   desses tipos é pela Expedição (não pelo detalhe do pedido).
4. **KDS** marca `pedido_itens.status_preparo` por praça; o pedido só vai
   para `pronto` quando todos os itens estão prontos.
5. **PDV** chama `fn_finalizar_venda_pdv` (atômico): confirmar → preparo →
   pronto → concluir.
6. **Pagamentos** não podem exceder o total; caixa precisa ser do mesmo
   operador/empresa e estar aberto.

## Hardening (0040+)

- Ownership em `fn_proximo_numero_pedido`
- Trigger de máquina de estados + itens só editáveis em `rascunho`
- Webhooks exigem assinatura (ou `INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED` em dev)
- Server Actions filtram por `empresa_id` da empresa ativa
- Queries de integrações/agentes não enviam ciphertext/`chave_api_hash` ao client

## Testes

- E2E: `e2e/03`–`06` (pedidos, caixa, PDV, mesas)
- Unitários: `npm test` (fórmulas de fichas e financeiro)
- SQL: `supabase/tests/checkpoint2_*.sql`
