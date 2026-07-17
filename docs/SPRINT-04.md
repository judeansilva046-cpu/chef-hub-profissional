# Sprint 04 — Dashboard, Relatórios, CRM, Etiquetas e Integrações

## Resumo

Seis frentes, todas reaproveitando 100% da arquitetura das Sprints 01–03
(RLS, padrão de feature folder, `ModuleSubNav`, paginação, Server Actions
com `useActionState`, fórmulas de `financeiro/calculations.ts`):

1. **Vendas** (`vendas`) — nova base transacional. Não fazia parte do pedido
   original nomeada assim, mas é o pré-requisito real para "Meta vs.
   Realizado", CMV/margem *realizados* e o CRM terem dado verdadeiro em vez
   de projeção. Ver decisão registrada na conversa que aprovou o plano
   desta sprint.
2. **Dashboard Executivo** (`/dashboard`).
3. **Relatórios Gerenciais** (`/relatorios`), exportação CSV.
4. **CRM de Clientes** (`/clientes`).
5. **Etiquetas de Validade + Fila de Impressão** (`/estoque/etiquetas`) +
   contrato da API do agente local (`docs/AGENTE-LOCAL.md`).
6. **Preparação de Integrações** (`/integracoes`) — estrutura, sem chamada
   real a API de provedor.

## Migrations

| Migration | Tabelas/funções |
| --- | --- |
| `0026_clientes.sql` | `clientes` |
| `0027_vendas.sql` | `vendas`, trigger `vendas_snapshot_custo()` |
| `0028_etiquetas_impressao.sql` | `agentes_impressao`, `fila_impressao`, `etiquetas_impressas`, função `fn_emitir_etiqueta(...)` |
| `0029_integracoes.sql` | `integracoes_canais`, `integracoes_logs_sincronizacao`, `integracoes_webhooks_recebidos` |

Detalhe de cada tabela/RLS/função em
[DATABASE.md](./DATABASE.md#sprint-04--dashboard-relatórios-crm-etiquetas-e-integrações).
Todas com RLS multiempresa (`empresa_id in (select id from empresas where
usuario_id = auth.uid())`), mesmo padrão desde a Sprint 01.

## Rotas criadas

```
/dashboard
/vendas
/clientes
/clientes/[id]
/relatorios
/estoque/etiquetas
/integracoes
/api/relatorios/[tipo]                 (GET — export CSV)
/api/agente-impressao/trabalhos         (GET — agente consulta jobs)
/api/agente-impressao/trabalhos/[id]     (PATCH — agente reporta status)
/api/webhooks/[provedor]                 (POST — inbox de webhook)
```

## Reuso deliberado (não duplicação)

- **Fórmulas**: `analisarVendas` (Dashboard) e os Relatórios chamam
  `calcularMargemContribuicaoReal`/`combinarCustosVariaveis`/
  `canalParaCustoVariavelAgregado` do Financeiro (Sprint 03) — nenhuma
  fórmula de margem/CMV nova.
- **`analisarFichasEmAlerta`**: extraída de dentro de
  `financeiro/painel/page.tsx` (estava inline) para
  `financeiro/calculations.ts`, agora compartilhada pelo Painel **e** pelo
  Dashboard — refactor comportamento-preservado.
- **Etiquetas** referenciam `estoque_lotes` por `lote_id` em vez de
  duplicar `numero_lote`/`data_validade`.
- **CRM** deriva ticket médio/frequência/última compra de `vendas`, não
  guarda essas métricas como coluna.
- **Relatórios** e **Dashboard** chamam as mesmas queries (`buscarVendasPorPeriodo`,
  `listarSaldosEstoque`, `listarProducoesPlanejadas`) — a exportação CSV
  roda a mesma consulta da tela.
- **`VendasFiltros`** (período + canal) é reaproveitado por Vendas,
  Dashboard e Relatórios — um componente, três telas.

## O que NÃO foi construído (fora de escopo, conforme pedido)

- Executável/serviço Windows do agente local — só o contrato de API e a
  documentação (`docs/AGENTE-LOCAL.md`).
- Chamadas reais a API de iFood/99Food/Keeta/Open Delivery — todo adapter
  lança `IntegracaoNaoDisponivelError`; nenhum dado fictício é tratado
  como integração real.
- Validação de assinatura de webhook real — sem segredo de provedor
  configurado, todo webhook recebido é logado com `assinatura_valida = false`.
- Geração real de PDF — `/api/relatorios/[tipo]?formato=pdf` retorna `501`.
- Baixa automática de estoque ao registrar uma venda — `vendas` é
  desacoplada de `estoque_lotes` nesta sprint (documentado como ponto de
  extensão para quando existir integração real de PDV/marketplace).

## Variáveis de ambiente novas

Ver `.env.example`:

- `SUPABASE_SERVICE_ROLE_KEY` — só para as Route Handlers do agente local e
  dos webhooks (`src/lib/supabase/service-role.ts`).
- `INTEGRACOES_SECRET_KEY` — chave AES-256-GCM (32 bytes, base64) para
  cifrar credenciais de integração antes de gravar no banco.

Sem essas variáveis configuradas em `.env.local`, "Conectar" em
`/integracoes` e a API do agente local retornam erro — comportamento
esperado, não um bug (ver "Pendências" no relatório final desta sprint).
