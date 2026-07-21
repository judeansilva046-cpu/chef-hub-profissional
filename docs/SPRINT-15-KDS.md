# Sprint 15 — Operação da Cozinha (KDS)

Kitchen Display System completo para o dia a dia do restaurante.

## Banco (`0049`)

Migration: `supabase/migrations/0049_kds_operacional.sql`  
Bundle: [`sql/aplicar-0049-kds-operacional.sql`](./sql/aplicar-0049-kds-operacional.sql)

| Alteração | Uso |
| --------- | --- |
| `pracas_producao.setor` | Cozinha / Bar / Sobremesas |
| `pedido_itens.preparo_iniciado_em` / `pronto_em` | Cronômetros e tempo médio |
| `kds_config` | Atraso, som, impressão automática, boost de prioridade |
| `kds_events` | Histórico operacional do KDS |

RPCs: `fn_marcar_item_pronto`, `fn_expedir_pedido_kds`, `fn_registrar_kds_evento`, `fn_seed_kds_config`  
RPCs atualizados: `fn_iniciar_preparo_pedido`, `fn_marcar_itens_pronto` (timestamps + eventos)

Impressão automática permanece nos triggers de `0038` (confirmado / em_preparo / expedição).

## App

| Rota | Função |
| ---- | ------ |
| `/kds` | Fila por status, setores, cronômetros, som, histórico, reimpressão, expedição |
| `/expedicao` | Fluxo entrega/retirada (inalterado; linkado pelo KDS) |

## Domínio

`src/features/kds/` — `prioridade`, `metrics`, `actions`, `queries`, `status`, alertas sonoros.

### Status (UI KDS)

Novo → Confirmado → Em preparo → Pronto → Expedido → Entregue / Cancelado  
(`Expedido` = `saiu_para_entrega`)

### Recursos

- Fila de produção com priorização automática (idade, tipo, atraso, itens)
- Tempo por pedido e por item (tick 1s)
- Tempo médio (últimas 24h)
- Alertas sonoros (novo / atraso)
- Separação por setor e praça
- Reimpressão na fila
- Expedição rápida (balcão/mesa) ou link para Expedição
- Histórico (`kds_events`)

## Roadmap seguinte (não nesta PR)

| Sprint | Foco |
| ------ | ---- |
| 16 | Estoque inteligente (ABC, giro, previsão, CMV) |
| 17 | CRM (pontos, cashback, campanhas, WhatsApp) |
| 18 | Homologação real (iFood, WhatsApp, PIX, impressoras) |
| 19 | Business Intelligence |
| 20 | IA operacional |
| 21 | Produção e hardening |

## Limitações

- Som depende de permissão de áudio do browser
- Sem migration `0049` aplicada, o KDS faz fallback parcial (sem tempos/histórico)
- Config KDS ainda sem tela de edição (defaults + seed)
