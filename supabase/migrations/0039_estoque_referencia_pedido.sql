-- Correção: fn_iniciar_preparo_pedido/fn_cancelar_pedido (0033) já
-- registravam movimentações de estoque com referencia_tipo = 'pedido', mas
-- o CHECK de estoque_movimentacoes (0013) nunca foi estendido para aceitar
-- esse valor — só um teste de integração pegou isso (consumo de estoque ao
-- iniciar preparo falhava em runtime). Mesmo tipo de extensão incremental
-- já feita em fila_impressao.tipo (0030), não uma recriação de tabela.
alter table public.estoque_movimentacoes
  drop constraint estoque_movimentacoes_referencia_tipo_check;
alter table public.estoque_movimentacoes
  add constraint estoque_movimentacoes_referencia_tipo_check check (
    referencia_tipo in ('compra', 'producao', 'ajuste', 'inventario', 'manual', 'pedido')
  );
