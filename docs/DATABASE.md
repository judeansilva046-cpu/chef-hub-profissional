# Banco de Dados

Projeto Supabase dedicado: `chef-hub-profissional` (região `sa-east-1`).
Migrations versionadas em `supabase/migrations/*.sql`, aplicadas via
Supabase MCP (`apply_migration`) — nunca editar o schema direto pelo SQL
Editor do painel sem depois refletir a mudança numa migration nova.

## Visão geral das tabelas

```
profiles (1) ─┬─< empresas (N, um usuário pode ter várias)
              │
empresas (1) ─┼─< unidades_medida (customizadas; empresa_id null = padrão do sistema)
              ├─< categorias_ingredientes
              ├─< ingredientes ──< ingredientes_historico_precos
              └─< fichas_tecnicas ─┬─< fichas_tecnicas_itens (> ingredientes)
                                    └─< fichas_tecnicas_versoes
```

- **`profiles`** — espelha `auth.users`, criada por trigger no signup
  (nunca por INSERT direto do cliente).
- **`empresas`** — um usuário pode ter **múltiplas empresas** (decisão de
  produto; sem `UNIQUE(usuario_id)`). A empresa "ativa" numa requisição é
  resolvida na aplicação (cookie), não no banco — ver
  `docs/ARCHITECTURE.md#autenticação-e-multi-empresa`.
- **`unidades_medida`** — `empresa_id` nulo = unidade padrão do sistema
  (seedada, imutável para qualquer usuário); preenchido = customizada da
  empresa. Sem motor de conversão entre unidades (limitação deliberada desta
  fase): um ingrediente usa a MESMA unidade na compra/custo e na ficha
  técnica. `tipo_grandeza` (`massa`/`volume`/`unidade`) só existe para
  UX e para não exigir migração quando um motor de conversão for construído.
- **`ingredientes`** — `custo_unitario_atual` é a fonte usada em novos itens
  de ficha técnica. Sem policy de `DELETE` (só `ativo=false`) — apagar
  cascatearia para `ingredientes_historico_precos`, destruindo o histórico.
- **`ingredientes_historico_precos`** — populada **só** por trigger
  (`registrar_historico_preco_ingrediente`, `SECURITY DEFINER`) sempre que
  `custo_unitario_atual` muda. Não existe policy de `INSERT` para
  `authenticated`: é estruturalmente impossível gravar histórico falso pela
  API.
- **`fichas_tecnicas`** — campos derivados (`custo_total`,
  `custo_por_porcao`, `preco_sugerido`, `cmv_percentual`,
  `margem_contribuicao_percentual`, `markup_percentual`, `peso_bruto_total`,
  `peso_liquido_total`) nunca são escritos pelo cliente — sempre recalculados
  por trigger. Ver [Fórmulas](#fórmulas).
- **`fichas_tecnicas_itens`** — `peso_liquido` e `custo_total_item` são
  **generated columns** do Postgres (`GENERATED ALWAYS ... STORED`).
  `custo_unitario_utilizado` é um **snapshot imutável** do custo do
  ingrediente no momento em que o item foi criado (nunca uma referência viva
  a `ingredientes.custo_unitario_atual`) — rastreabilidade histórica: o
  custo de uma ficha salva não muda silenciosamente quando um ingrediente é
  reajustado depois.
- **`fichas_tecnicas_versoes`** — um snapshot completo (`jsonb`) por chamada
  bem-sucedida de `salvar_ficha_tecnica` — um "Salvar" na UI = uma versão,
  sem exigir que o usuário lembre de clicar em algo à parte. Sem policy de
  `INSERT`/`UPDATE`/`DELETE` para `authenticated`: só a função
  `salvar_ficha_tecnica` (`SECURITY DEFINER`) grava aqui.

## Único caminho de escrita de ficha técnica

`fichas_tecnicas` + `fichas_tecnicas_itens` + `fichas_tecnicas_versoes` **só**
são escritas através da função Postgres `salvar_ficha_tecnica(...)`, chamada
via `supabase.rpc(...)` em `src/features/fichas-tecnicas/actions.ts`. Ela:

1. Valida manualmente que a empresa (e, em edição, a ficha) pertence ao
   usuário logado (`SECURITY DEFINER` ignora RLS — por isso a checagem é
   obrigatória e explícita no início da função).
2. Cria ou atualiza a linha de `fichas_tecnicas`.
3. Substitui **inteiramente** a lista de itens (`DELETE` + `INSERT`) — mais
   simples e confiável do que diffar uma lista dinâmica de tamanho
   ilimitado vinda do cliente.
4. Grava um novo snapshot em `fichas_tecnicas_versoes` e incrementa
   `versao_atual`.

Tudo numa única transação (atomicidade: nunca fica uma ficha "pela metade"
por falha de rede no meio do salvamento).

`fn_duplicar_ficha_tecnica(id)` é um wrapper fino: lê a ficha de origem (via
RLS normal — por isso é `SECURITY INVOKER`, não precisa bypassar nada) e
chama `salvar_ficha_tecnica` com `fichaId = null`, reusando exatamente o
mesmo caminho validado/versionado/recalculado.

### Trigger de recálculo (defesa em profundidade)

Independentemente de `salvar_ficha_tecnica`, `fichas_tecnicas_itens` tem
triggers próprias (`fichas_tecnicas_itens_after_change` →
`recalcular_ficha_tecnica`, e `fichas_tecnicas_before_upsert_calcular` em
`fichas_tecnicas`) que recalculam os campos derivados sempre que a tabela de
itens muda, **por qualquer caminho** — não só pela RPC. Isso garante
corretude mesmo que no futuro uma importação em lote ou integração (PDV/ERP)
escreva itens diretamente. `src/features/fichas-tecnicas/calculations.ts`
replica as MESMAS fórmulas em TypeScript **só** para preview otimista no
formulário (atualização a cada tecla, sem round-trip ao banco) — duplicação
deliberada e documentada; o banco continua sendo a fonte de verdade.

## Fórmulas

```
peso_liquido_item   = peso_bruto_item × (1 − percentual_perda_item / 100)
custo_total_item    = peso_bruto_item × custo_unitario_utilizado_item
  # custo é sobre o peso BRUTO (o que foi comprado/pago) — a perda afeta
  # rendimento, não o valor pago

custo_total (ficha)  = Σ custo_total_item
custo_por_porcao      = custo_total / rendimento_quantidade

margem_alvo_efetiva = COALESCE(ficha.margem_contribuicao_percentual_alvo,
                                 empresa.margem_contribuicao_padrao,
                                 70)  # constante de sistema

preco_sugerido = custo_por_porcao / (1 − margem_alvo_efetiva / 100)
  # preço que entrega a margem de contribuição alvo sobre o custo direto de
  # ingredientes (prioridade: alvo da ficha > padrão da empresa > 70%)

preco_referencia = COALESCE(preco_venda_praticado, preco_sugerido)
  # métricas de % sempre usam o preço praticado quando existe; senão, o
  # sugerido

cmv_percentual (= food_cost_percentual, MESMO valor, dois rótulos na UI)
  = (custo_por_porcao / preco_referencia) × 100

margem_contribuicao_percentual = 100 − cmv_percentual

markup_percentual = ((preco_referencia / custo_por_porcao) − 1) × 100
```

**CMV % e Food Cost %** são a mesma métrica neste nível (custo do
ingrediente ÷ preço de venda) — um único campo `cmv_percentual`, dois
rótulos na UI. Isso é o food cost _do item_, diferente do CMV contábil
período-a-período (estoque inicial + compras − estoque final), que só fará
sentido quando existir o pilar Controle de Estoque.

**Markup % e Margem de contribuição %** são matematicamente relacionados
(`margem% = markup% / (100 + markup%) × 100`) mas numericamente distintos —
ambos aparecem na UI porque o mercado brasileiro usa as duas linguagens.

## RLS (Row Level Security)

Toda tabela com `empresa_id` restringe acesso a
`empresa_id IN (SELECT id FROM empresas WHERE usuario_id = (SELECT auth.uid()))`
(o `SELECT auth.uid()` extra é a forma recomendada pelo Supabase para o
Postgres tratar a função como InitPlan, avaliada uma vez por statement em
vez de por linha). Tabelas de auditoria (`ingredientes_historico_precos`,
`fichas_tecnicas_versoes`) só têm policy de `SELECT` — toda escrita passa
por uma função `SECURITY DEFINER` com checagem de autorização manual.

**Convenção do projeto**: toda função `SECURITY DEFINER` que grava dados
deve reimplementar manualmente a checagem de autorização relevante logo no
início, porque `SECURITY DEFINER` ignora RLS por definição. Isso está
comentado em cada função no SQL — ver `supabase/migrations/0007` e `0010`.

## Alertas de segurança/performance conhecidos e aceitos

Rodados via `get_advisors` do Supabase após cada migration:

- `pg_trgm` instalada no schema `public` (sugestão: mover para schema
  `extensions`). Decisão deliberada: baixo risco (a extensão não expõe
  dados, só operadores de busca) e mover depois de já existirem índices GIN
  dependentes dela adiciona risco de complicar migrations futuras sem ganho
  de segurança real.
- `salvar_ficha_tecnica` é `SECURITY DEFINER` e chamável por usuários
  autenticados — **intencional**, é o único caminho de escrita de ficha
  técnica; a função já valida `empresa_id` manualmente (ver acima).
- `fn_recalcular_estoque_saldo` (ver abaixo) é `SECURITY DEFINER` e chamável
  por `authenticated` pelo mesmo motivo — validação manual de posse dentro
  da função (migration `0022`).
- As funções do CRM que escrevem em ledgers (`fn_conceder_pontos_manual`,
  `fn_resgatar_pontos_fidelidade`, `fn_estornar_movimentacao_fidelidade`,
  `fn_expirar_pontos_fidelidade` e os equivalentes de cashback/cupom,
  migrations `0047`-`0049`) são `SECURITY DEFINER` e chamáveis por
  `authenticated` pelo mesmo motivo de `fn_recalcular_estoque_saldo` —
  cada uma valida manualmente que o `cliente_id`/`empresa_id` recebido
  pertence ao usuário autenticado antes de escrever. `fn_registrar_auditoria_crm`
  e `vendas_after_insert_conceder_pontos`/`vendas_after_insert_creditar_cashback`
  aparecem como "chamáveis por anon" no advisor pelo mesmo motivo de
  `fn_registrar_auditoria_financeira` (Sprint 06): são funções de trigger —
  o Postgres rejeita a chamada fora do contexto de trigger (`NEW`/`OLD`
  indisponíveis), então a exposição via `/rest/v1/rpc/...` é inofensiva na
  prática.

## Sprint 02 — Estoque, Compras, Produção e Lista de Compras

Quatro módulos novos, todos seguindo o mesmo padrão da Ficha Técnica:
**único caminho de escrita** via função Postgres para qualquer operação que
tenha efeito colateral em outra tabela, RLS em toda tabela com `empresa_id`,
e hardening (`search_path`, `revoke execute`) aplicado após o schema
(migrations `0020`–`0022`).

```
ingredientes (1) ─┬─< estoque_lotes ──< estoque_movimentacoes
                   ├─< estoque_saldos (cache agregado, 1:1 por empresa)
                   └─< fornecedor_ingredientes >── fornecedores

empresas (1) ─┬─< estoque_inventarios ─< estoque_inventario_itens
              ├─< fornecedores ─< fornecedor_ingredientes
              ├─< solicitacoes_compra ─< solicitacoes_compra_itens
              ├─< pedidos_compra ─< pedidos_compra_itens
              ├─< producoes_planejadas (referencia fichas_tecnicas)
              └─< listas_compra ─< listas_compra_itens
```

### Controle de Estoque — FIFO como mecanismo único de custeio

- **`estoque_lotes`** — cada entrada de estoque cria um lote com seu próprio
  `custo_unitario` e `quantidade_atual` (decrementada ao ser consumido).
  Nunca é editado diretamente pelo cliente.
- **`estoque_movimentacoes`** — ledger **append-only** (sem `UPDATE`/`DELETE`
  nas policies): uma linha por lote afetado em cada entrada/saída, com
  `tipo` (`entrada`/`saida`/`ajuste_entrada`/`ajuste_saida`/`inventario`) e
  `referencia_tipo` (`compra`/`producao`/`ajuste`/`inventario`/`manual`) para
  rastrear a origem sem precisar de uma FK polimórfica real.
- **`estoque_saldos`** — cache agregado (`quantidade_total`,
  `custo_medio_ponderado`) por ingrediente, **mantido só por trigger**
  (`estoque_lotes_after_change` → `fn_recalcular_estoque_saldo`). Nunca é
  a fonte de verdade — é sempre derivável de `estoque_lotes`.
- **Custo médio ponderado é informativo, não um método de custeio
  concorrente.** Quem decide o custo de cada saída é sempre o FIFO real dos
  lotes (`fn_registrar_saida_estoque`, migration `0014`): consome os lotes
  mais antigos primeiro (`ORDER BY data_entrada, id`, com `FOR UPDATE` para
  evitar condição de corrida em saídas concorrentes), podendo gravar várias
  linhas de movimentação numa única chamada se precisar tocar mais de um
  lote.
- **Único caminho de escrita**: `fn_registrar_entrada_estoque` e
  `fn_registrar_saida_estoque` (migration `0014`) são as **únicas** funções
  que gravam em `estoque_lotes`/`estoque_movimentacoes`. Todo o resto do
  Sprint 02 que mexe em estoque — recebimento de pedido de compra, conclusão
  de produção, conclusão de inventário — chama essas duas funções por baixo,
  em vez de duplicar a lógica de consumo/criação de lote.
- **`estoque_inventarios` / `estoque_inventario_itens`** — contagem física:
  `quantidade_sistema` é um snapshot do saldo no momento em que o item entra
  na contagem; `fn_concluir_inventario` (migration `0015`) compara com
  `quantidade_contada` e gera uma entrada (sobra) ou saída (falta) via as
  funções únicas acima — nunca mexe em `estoque_lotes` diretamente.

### Compras — Fornecedores, Solicitações e Pedidos

- **`fornecedores`** — sem `DELETE` (podem estar referenciados em pedidos
  antigos); "remover" = `ativo = false`.
- **`fornecedor_ingredientes`** — lista de preços por fornecedor/ingrediente,
  usada no comparativo de preços e como sugestão automática na lista
  inteligente de compras. `UNIQUE(fornecedor_id, ingrediente_id)` — salvar um
  preço novo faz `upsert` nesse par.
- **`solicitacoes_compra`** — pedido interno de reposição (`pendente` →
  `aprovada`/`rejeitada` → `convertida`). Não grava em estoque nem em
  pedidos diretamente.
- **`pedidos_compra`** — compromisso com um fornecedor específico
  (`rascunho` → `enviado` → `parcialmente_recebido`/`recebido`/`cancelado`).
  Pode nascer de uma solicitação aprovada (`converterSolicitacaoEmPedido`,
  que agrupa **todos** os itens da solicitação num único pedido para um
  fornecedor escolhido) ou ser criado direto.
- **Recebimento**: `fn_receber_item_pedido_compra` (migration `0017`) chama
  `fn_registrar_entrada_estoque` com `referencia_tipo = 'compra'`, atualiza
  `quantidade_recebida` do item e recalcula o `status` do pedido
  (`recebido` quando 100% recebido, `parcialmente_recebido` caso contrário).

### Planejamento de Produção — uma tabela para diário e semanal

`producoes_planejadas` é a única tabela; "visão diária" e "visão semanal" no
produto são apenas agrupamentos de `data_producao` feitos na consulta (ver
`src/features/producao/date-range.ts`), evitando duplicar schema para
granularidades diferentes de uma mesma coisa.

`fn_concluir_producao` (migration `0018`) fecha o ciclo Ficha Técnica →
Planejamento → Estoque: calcula `fator = quantidade_planejada /
rendimento_quantidade` e chama `fn_registrar_saida_estoque` para cada item
da ficha, `peso_bruto × fator`. Tudo numa transação — se faltar estoque de
qualquer ingrediente, a função inteira falha e nada é consumido.

**"Planejamento automático"** foi interpretado como "repetir a semana
anterior" (`repetirSemanaAnterior`, copia as produções não canceladas dos
mesmos 7 dias anteriores, deslocando a data em +7) — uma ação previsível e
auditável, em vez de um motor de previsão de demanda não solicitado.

### Lista Inteligente de Compras

`fn_gerar_lista_compras(empresa_id, nome, data_inicio, data_fim)` (migration
`0019`) calcula, para o período informado:

```
consumo_previsto(ingrediente) = Σ (peso_bruto_item × quantidade_planejada / rendimento_quantidade)
  # somado sobre toda produção planejada/em_producao no período

necessidade_compra(ingrediente) = max(0, consumo_previsto + estoque_minimo − estoque_atual)
```

mais uma segunda passada de **reposição de segurança**: ingredientes já
abaixo do `estoque_minimo` mesmo sem nenhuma produção planejada no período
(evita ruptura de estoque que uma lista puramente orientada a demanda
deixaria passar). Para cada item, sugere o fornecedor de menor preço
conhecido em `fornecedor_ingredientes`.

`fn_converter_lista_em_pedidos(lista_id)` (migration `0019`) agrupa os itens
por `fornecedor_id` e cria um `pedido_compra` (rascunho) por fornecedor —
essa é a única função do Sprint 02 que cria **múltiplos** registros
relacionados a partir de uma única chamada. Falha se algum item ainda não
tiver fornecedor definido (a UI exige resolver isso antes de converter).

### Bug corrigido durante o teste E2E: trigger de `atualizado_em`

`set_updated_at()` (função compartilhada desde a Sprint 01) escreve em
`NEW.updated_at`. `solicitacoes_compra`, `pedidos_compra` e
`producoes_planejadas` usam a coluna `atualizado_em` (padrão em português do
restante do schema da Sprint 02), então todo `UPDATE` nessas três tabelas
falhava em runtime com `record "new" has no field "updated_at"` — só
descoberto ao testar "Aprovar solicitação" via UI, pois `INSERT`/`SELECT` não
disparam esse trigger. `fornecedores` usa `updated_at` (padrão da Sprint 01)
e nunca foi afetada. Corrigido na migration `0023`: nova função
`set_atualizado_em()`, com as três triggers recriadas para usá-la.

## Sprint 03 — Financeiro (Precificação, custeio completo e canais de venda)

Quatro tabelas novas, todas **CRUD simples sem RPC** (diferente de
Estoque/Compras/Produção): nenhuma delas tem efeito colateral em outra
tabela ao ser escrita, então não há função Postgres dedicada — só RLS +
trigger de `atualizado_em` (reaproveitando `set_atualizado_em()`, migration
`0023`).

```
empresas (1) ─┬─< custos_fixos
              ├─< custos_variaveis
              ├─< metas_vendas
              └─< canais_venda
```

- **`custos_fixos`** — despesas mensais recorrentes (aluguel, salários),
  independentes do volume de vendas. Base do Ponto de Equilíbrio.
- **`custos_variaveis`** — custos que só existem quando há uma venda (taxa
  de cartão, embalagem) e incidem em **qualquer** canal, ao contrário de
  `canais_venda` (abaixo).
- **`metas_vendas`** — uma meta de faturamento por mês (`UNIQUE(empresa_id,
  mes_referencia)`), usada para calcular a margem de contribuição mínima
  necessária.
- **`canais_venda`** — comissão (`taxa_percentual`) + taxa fixa
  (`taxa_fixa`) de cada canal de venda: iFood, 99Food, Keeta, Delivery
  Próprio (`tipo` fixo, seedados automaticamente para toda empresa —
  migration `0025` para empresas existentes, `criarEmpresa` em
  `src/features/empresa/actions.ts` para empresas novas) e canais
  personalizados (`tipo = 'personalizado'`, nome livre, múltiplos
  permitidos). Índice único parcial em `(empresa_id, tipo) WHERE tipo <>
  'personalizado'` impede duplicar iFood/99Food/Keeta/Delivery Próprio na
  mesma empresa.

Nenhuma tabela do Sprint 03 duplica dado do Sprint 02: tudo lê
`fichas_tecnicas.custo_por_porcao` / `preco_venda_praticado` /
`preco_sugerido` (já calculados por trigger, ver [Fórmulas](#fórmulas))
como entrada — `src/features/financeiro/queries.ts` só agrega.

### Fórmulas do módulo Financeiro (não duplicam as da Ficha Técnica)

`src/features/financeiro/calculations.ts` só combina o que a Ficha Técnica
já calculou com os custos variáveis/canal — nenhuma fórmula acima
(`custo_total`, `preco_sugerido`, `cmv_percentual`, etc.) é reimplementada:

```
# custosVariaveis = agregado de custos_variaveis ativos (geral) e/ou de UM
# canais_venda (taxa_percentual, taxa_fixa) — combináveis via
# combinarCustosVariaveis() quando uma venda passa por um canal específico.

margem_contribuicao_real
  = preço − custo_por_porcao − (preço × custosVariaveis.percentual/100 + custosVariaveis.fixo)

margem_alvo_implícita = 1 − (custo_por_porcao / preco_sugerido)
  # extraída do preco_sugerido já calculado pelo banco (não reimplementa a
  # cadeia de prioridade alvo da ficha > padrão da empresa > 70%)

preco_para_margem_alvo   # "preço sugerido" com custeio completo (variáveis
                          # gerais + canal), usado na Precificação por canal
  = (custo_por_porcao + custosVariaveis.fixo)
    / (1 − margemAlvo/100 − custosVariaveis.percentual/100)

margem_necessária_percentual = custos_fixos_totais / meta_receita_mensal
ponto_equilibrio_receita     = custos_fixos_totais / (margem_contribuicao_média/100)
ponto_equilibrio_unidades    = custos_fixos_totais / margem_contribuicao_unitária

quantidade_equivalente_promocao = (quantidade_base × margem_unitária_original) / margem_unitária_promocional
```

### Segurança: `fn_recalcular_estoque_saldo`

Única função `SECURITY DEFINER` do Sprint 02 que não pôde ter `EXECUTE`
revogado de `authenticated` — é chamada internamente pela trigger
`fn_estoque_lotes_recalcular_saldo`, que roda como `SECURITY INVOKER` (ou
seja, como o próprio usuário autenticado que disparou o INSERT/UPDATE/DELETE
em `estoque_lotes`). Migration `0022` adicionou checagem manual: o
ingrediente deve pertencer à `empresa_id` informada, e essa empresa deve
pertencer ao usuário atual — sem isso, um usuário autenticado poderia chamar
a função via RPC com um `ingrediente_id` de uma empresa e um `empresa_id` de
outra (ambas seriam suas, já que só pode manipular suas próprias empresas),
poluindo `estoque_saldos` com dados cruzados. Verificado via `get_advisors`
como alerta revisado/aceito, mesma categoria de `salvar_ficha_tecnica`.

## Sprint 04 — Dashboard, Relatórios, CRM, Etiquetas e Integrações

Sete tabelas novas (migrations `0026`–`0029`), documentação completa em
[docs/SPRINT-04.md](./SPRINT-04.md).

```
empresas (1) ─┬─< clientes
              ├─< vendas ──> fichas_tecnicas / canais_venda / clientes
              ├─< agentes_impressao
              ├─< fila_impressao
              ├─< etiquetas_impressas ──> estoque_lotes
              ├─< integracoes_canais ──< integracoes_logs_sincronizacao
              └─< integracoes_webhooks_recebidos
```

### `vendas` (migration `0027`) — a base transacional que faltava

Até a Sprint 03, o schema não tinha nenhum registro de venda realizada — só
`metas_vendas` (meta) e `fichas_tecnicas.preco_venda_praticado` (preço
cadastrado, não uma transação). Sem isso, "Meta vs. Realizado", CMV/margem
*realizados* e "produtos mais/menos rentáveis" não têm dado real para
agregar. `vendas` resolve isso: `ficha_tecnica_id` (obrigatório),
`canal_venda_id`/`cliente_id` (opcionais), `quantidade`,
`preco_unitario_praticado`, `data_venda`.

- **`custo_unitario_snapshot`** — imutável, gravado por trigger `BEFORE
  INSERT` (`vendas_snapshot_custo()`) a partir de
  `fichas_tecnicas.custo_por_porcao` no momento da venda — nunca aceito do
  cliente da API, mesmo princípio de
  `fichas_tecnicas_itens.custo_unitario_utilizado`. Por isso a edição de
  uma venda (`atualizarVenda`) nunca permite trocar `ficha_tecnica_id`: o
  snapshot só é recalculado na criação.
- **`valor_total`/`margem_total`** — generated columns (`quantidade ×
  preco_unitario_praticado` e `(preco_unitario_praticado −
  custo_unitario_snapshot) × quantidade`), mesmo padrão de
  `fichas_tecnicas_itens.custo_total_item`.
- CRUD simples, sem outra tabela afetada — registrar uma venda **não** baixa
  estoque nesta sprint (ponto de extensão documentado para quando existir
  integração real de PDV/marketplace, ver `docs/ARCHITECTURE.md`).

### Dashboard e Relatórios não recalculam nada — só agregam

`src/features/dashboard/calculations.ts` (`analisarVendas`) aplica
`calcularMargemContribuicaoReal` (Sprint 03) linha a linha sobre as vendas
do período, combinando custos variáveis gerais + a taxa do canal daquela
venda (`combinarCustosVariaveis` + `canalParaCustoVariavelAgregado`, ambas
já existentes) — nenhuma fórmula de margem/CMV é reimplementada, só
somada/agrupada (por produto, por canal). Os Relatórios Gerenciais
(`src/features/relatorios/*`) chamam a **mesma** `analisarVendas` e as
mesmas queries do Dashboard/Estoque/Compras/Produção — a exportação CSV
(`/api/relatorios/[tipo]`) roda a mesma consulta da tela, sem duplicar
lógica entre visualização e exportação.

`analisarFichasEmAlerta` (extraída de `financeiro/calculations.ts` nesta
sprint, antes vivia inline em `financeiro/painel/page.tsx`) agora é
compartilhada pelo Painel Nunca no Vermelho **e** pelo Dashboard Executivo
— refactor comportamento-preservado, não uma funcionalidade nova.

### `clientes` (migration `0026`) — CRM

Mesmo padrão de `fornecedores`: CRUD simples, sem `DELETE` (cliente pode
estar referenciado em `vendas` antigas — "remover" = `ativo = false`).
**Ticket médio, frequência e última compra não são colunas** — sempre
derivados de `vendas` por `cliente_id` em `buscarEstatisticasCliente`
(`src/features/clientes/queries.ts`), mesmo princípio de `estoque_saldos`
ser só cache derivável de `estoque_lotes`.

### Etiquetas de Validade + Fila de Impressão (migration `0028`)

Três tabelas, para o fluxo `Chef Hub Web → fila_impressao → Agente Local
Windows → Impressora Térmica` (contrato completo em
[docs/AGENTE-LOCAL.md](./AGENTE-LOCAL.md)):

- **`etiquetas_impressas`** — histórico de emissão (append-only, só
  `SELECT`/`INSERT`), referencia `estoque_lotes` por `lote_id` em vez de
  duplicar `numero_lote`/`data_validade`.
- **`fila_impressao`** — jobs com `status` (`pendente` → `processando` →
  `concluido`/`erro`), `payload` jsonb com os dados já resolvidos para o
  agente renderizar a etiqueta.
- **`agentes_impressao`** — credencial do agente local por empresa: só o
  hash SHA-256 da chave é gravado (`chave_api_hash`), nunca a chave em
  texto puro — mesmo princípio de senha.
- **`fn_emitir_etiqueta(...)`** (`SECURITY INVOKER`) — único caminho de
  escrita: cria o job na fila **e** o registro histórico numa única
  transação, mesmo motivo de toda função "único caminho de escrita" do
  projeto (nunca uma etiqueta "pela metade" se a conexão cair no meio).
  `SECURITY INVOKER` porque as duas tabelas já permitem `INSERT` direto
  para o usuário autenticado via RLS — não precisa bypassar nada, mesmo
  caso de `fn_duplicar_ficha_tecnica`.

**Autenticação do agente local não usa Supabase Auth**: é um processo
headless no Windows, sem sessão de navegador. Autentica via
`Authorization: Bearer <chave>`, validada contra `chave_api_hash`
(`src/features/etiquetas/agente-auth.ts`), rodando com o client
**service-role** (`src/lib/supabase/service-role.ts`, novo nesta sprint) —
bypassa RLS deliberadamente, com checagem manual de posse (job pertence à
mesma empresa do agente), mesmo princípio das funções `SECURITY DEFINER`.
`fila_impressao` não tem policy de `UPDATE` para `authenticated`: a
transição de status só acontece pela API do agente (service-role).

### Integrações (migration `0029`) — estrutura, sem chamada real

`integracoes_canais` (uma linha por `(empresa_id, provedor)`, `provedor in
('ifood','99food','keeta','open_delivery')`), `integracoes_logs_sincronizacao`
(append-only) e `integracoes_webhooks_recebidos` (append-only, **sem**
policy de `INSERT` para `authenticated` — só a Route Handler
`/api/webhooks/[provedor]`, rodando com service-role, grava aqui; mesmo
padrão de `ingredientes_historico_precos`).

- **Credenciais não são criptografadas dentro do Postgres** —
  `credenciais_criptografadas` guarda só o texto já cifrado em AES-256-GCM
  pela aplicação (`src/features/integracoes/crypto.ts`, chave em
  `INTEGRACOES_SECRET_KEY`, variável de ambiente). Cifrar dentro do SQL
  exigiria guardar a chave de criptografia numa migration ou função do
  banco — menos seguro, não mais, já que qualquer leitura do schema
  revelaria a chave.
- **Nenhum adapter (`src/integrations/*`) chama uma API real** — todos
  lançam `IntegracaoNaoDisponivelError`. Conectar só grava as credenciais
  cifradas e marca `status_conexao = 'pendente_homologacao'`; "testar
  conexão" sempre volta essa mesma mensagem. Isso é intencional: nenhuma
  dessas integrações tem credencial de parceiro homologado.

## Sprint 07 — CRM e Fidelização

Nove migrations (`0045`-`0053`). Estende `clientes` (0026, Sprint 04) em vez
de recriar; todo o resto é schema novo. RLS de todas as tabelas novas segue
o padrão simples "dono da empresa" já usado em `clientes`/`vendas`/`pedidos`
— o CRM **não** introduz um segundo sistema de papéis além do
`usuarios_empresa` do Financeiro (Sprint 06); reaproveitar aquele exigiria
acoplar dois domínios sem necessidade real nesta sprint.

### `clientes` — extensão + `crm_clientes_metricas` (migration `0045`)

Novas colunas: `whatsapp`, `data_nascimento`, `restricoes_alimentares`,
`tags text[]`, `origem`, `opt_in_whatsapp`/`opt_in_email`/`opt_in_sms`,
`consentimento_lgpd` + `consentimento_lgpd_em` (LGPD é só um booleano com
carimbo de quando foi concedido — sem histórico de termos versionados,
fora do escopo). `segmento` (rótulo manual, Sprint 04) continua existindo
sem alteração; segmentação **calculada** é um conceito novo e separado (ver
abaixo), não substitui o rótulo manual.

`crm_clientes_metricas` é uma **view** (`security_invoker = true`, para
respeitar a RLS de quem consulta, não do dono da view) que agrega
`total_gasto`/`quantidade_compras`/`ticket_medio`/`dias_desde_ultima_compra`
por cliente a partir de `vendas` — mesmo princípio de nunca duplicar em
coluna o que já é derivável, agora centralizado num único lugar (antes só
existia em `buscarEstatisticasCliente`, TypeScript) para ser reaproveitado
por Segmentação, Perfil 360 e Dashboard CRM sem repetir a agregação.

### Segmentação (migration `0046`)

Os segmentos automáticos (Novo, Recorrente, Inativo, VIP, Alto ticket,
Baixa frequência, Risco de abandono, Aniversariante) **não são tabela** —
são calculados em `src/features/crm-segmentacao/calculations.ts` a partir
de `crm_clientes_metricas`, com os limiares (ex: VIP = top 10% de gasto)
documentados no próprio arquivo. `crm_segmentos_personalizados` guarda só a
**definição do filtro** (`criterios jsonb`) de segmentos customizados — a
lista de membros também é sempre recalculada em leitura
(`avaliarSegmentoPersonalizado`), nunca uma tabela de associação.

### Fidelidade e Cashback (migrations `0047`, `0048`)

Dois ledgers assinados independentes — `crm_fidelidade_movimentacoes`
(`pontos`) e `crm_cashback_movimentacoes` (`valor`, R$) — mesmo padrão de
`estoque_movimentacoes`: toda linha é imutável, todo ajuste (resgate,
estorno, expiração) é uma nova linha com sinal oposto, saldo é sempre
`sum(pontos)`/`sum(valor)`. Nenhuma das duas tabelas tem policy de
`INSERT`/`UPDATE` para `authenticated` — todo lançamento passa por uma
função `SECURITY DEFINER` (mesmo motivo de `pedido_status_historico`).

- **Concessão automática**: triggers `vendas_after_insert_fidelidade` /
  `vendas_after_insert_cashback` (`AFTER INSERT ON vendas`) — como
  `fn_concluir_pedido` (0033, Sprint 05) já insere em `vendas` ao concluir
  um pedido, fidelidade/cashback são creditados automaticamente em
  qualquer venda com `cliente_id`, sem alterar nenhum caminho existente de
  pedidos/PDV/mesas/expedição.
- **Expiração é sob demanda, não agendada** — este projeto não tem
  `pg_cron`/job scheduler. `fn_expirar_pontos_fidelidade`/`fn_expirar_cashback`
  percorrem os lançamentos vencidos em ordem (FIFO) e expiram o menor entre
  "pontos daquele lançamento" e "saldo atual restante", disparadas por um
  botão ("Processar pontos/cashback expirados") em vez de automaticamente à
  meia-noite. **Risco/pendência real**: um operador que nunca clicar nesse
  botão nunca expira pontos vencidos.
- Níveis de fidelidade (`crm_fidelidade_niveis`) são só metadado — em qual
  nível um cliente está é sempre comparado contra o saldo em leitura, nunca
  gravado no cliente.

### Cupons (migration `0049`)

`crm_cupons` é CRUD normal; `crm_cupons_usos` é ledger de uso (sem `INSERT`
direto). `fn_validar_e_aplicar_cupom` faz `select ... for update` na linha
do cupom antes de checar limites — trava a corrida de dois PDVs aplicando o
mesmo cupom no limite exato ao mesmo tempo. Só `percentual`/`fixo` calculam
desconto monetário; `frete_gratis`/`produto_gratis` devolvem `valor_desconto
= 0` mais o `tipo`, deixando a aplicação decidir como zerar a taxa de
entrega ou adicionar o item grátis — **frete_gratis/produto_gratis não
estão integrados ao PDV nesta sprint** (só `percentual`/`fixo`, ver
`src/features/pedidos/components/pdv-workspace.tsx`), risco documentado no
relatório da sprint. `fn_estornar_uso_cupom` **apaga** a linha de uso (não
lança estorno) — diferente dos ledgers financeiros, "uso de cupom" é
contagem de controle, não valor monetário próprio.

### Comunicação e Campanhas (migration `0050`)

`crm_interacoes` é um **registro** de contato (WhatsApp/e-mail/SMS/
ligação/presencial/nota/reclamação), não um disparador — **este projeto
não tem nenhuma integração de envio real** (confirmado: nenhum SDK de
WhatsApp Business API/Twilio/provedor de e-mail existe em
`src/features/integracoes` nem em variável de ambiente), então
`status_entrega` fica `'pendente'` para canais externos até uma integração
real existir. `crm_campanhas` (gatilho: aniversário/inatividade/primeira
compra/manual) é disparada sob demanda por Server Action
(`dispararCampanha`, sem `pg_cron`, mesmo motivo da expiração de
pontos/cashback acima) — busca clientes elegíveis no momento do clique,
grava uma `crm_interacao` por cliente ainda não contatado por aquela
campanha (dedup por `campanha_id`+`cliente_id`, para clicar de novo não
reenviar).

### Funil comercial (migration `0051`)

Lead e Oportunidade são o **mesmo registro** (`crm_leads`) avançando por
etapas configuráveis (`crm_funil_etapas`, seedadas por empresa: Novo Lead →
Contato Feito → Proposta → Negociação → Ganho/Perdido) — mesmo princípio de
`pedidos` usar um único registro + histórico de status em vez de uma tabela
por estado. `crm_leads_historico` é append-only via trigger (mesmo padrão
de `pedido_status_historico`). `fn_converter_lead_em_cliente` é
`SECURITY INVOKER` (não `DEFINER`): tanto o `INSERT` em `clientes` quanto o
`UPDATE` em `crm_leads` já são permitidos pela RLS do próprio usuário, a
função só garante que as duas escritas acontecem atomicamente — mesmo
motivo de `fn_criar_conta_receber` (Sprint 06).

### Tarefas (migration `0052`)

`crm_tarefas` usa `referencia_tipo`/`referencia_id` (polimórfico-leve, mesmo
padrão de `estoque_movimentacoes`) para associar a um cliente OU um lead
sem duas colunas de FK nullable. `concluida_em` é gravado por trigger na
transição para `status = 'concluida'` — nunca aceito do cliente da API,
mesmo princípio dos timestamps de transição de `pedidos`.

### Auditoria e Realtime (migration `0053`)

`crm_auditoria` + `fn_registrar_auditoria_crm()` reaproveitam exatamente o
padrão genérico de `financeiro_auditoria`/`fn_registrar_auditoria_financeira`
(Sprint 06) — tabela própria porque o RLS de leitura aqui é ownership
simples (sem o `fn_tem_acesso_financeiro` multiusuário do Financeiro).
Ledgers já append-only (fidelidade, cashback, usos de cupom, histórico de
leads) não recebem trigger de auditoria — eles já **são** o próprio rastro.
Realtime habilitado só em `crm_leads` (Kanban) e `crm_tarefas` — mesmo
critério seletivo da 0037, não uma extensão geral do Realtime para o CRM
inteiro.

### Riscos e pendências conhecidas desta sprint

- Expiração de pontos/cashback e disparo de campanhas dependem de um
  clique manual — sem `pg_cron`, nada expira/dispara sozinho.
- Cupons `frete_gratis`/`produto_gratis` não têm aplicação automática no
  PDV (só `percentual`/`fixo`).
- `crm_interacoes` registra o envio mas não envia de verdade — nenhuma
  integração de mensageria existe no projeto.
- Cupons com `segmento` preenchido validam contra `clientes.segmento`
  (rótulo manual), não contra os segmentos calculados — um cupom "só para
  VIP calculado" não é reforçado no banco, só a lista de destinatários
  filtrada manualmente na tela de campanhas.
- Este projeto não tem conceito de múltiplas unidades/lojas por empresa —
  os itens do escopo original que mencionavam "unidade preferida"/"unidade
  permitida" não têm onde ancorar e ficaram de fora.
