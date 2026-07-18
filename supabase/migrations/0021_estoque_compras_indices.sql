-- Índices cobrindo foreign keys que faltavam (get_advisors), mesma rotina
-- da Sprint 02.
create index estoque_inventario_itens_ingrediente_idx on public.estoque_inventario_itens (ingrediente_id);
create index estoque_inventarios_criado_por_idx on public.estoque_inventarios (criado_por);
create index estoque_movimentacoes_criado_por_idx on public.estoque_movimentacoes (criado_por);
create index estoque_movimentacoes_lote_idx on public.estoque_movimentacoes (lote_id);
create index estoque_saldos_ingrediente_idx on public.estoque_saldos (ingrediente_id);
create index fornecedor_ingredientes_empresa_idx on public.fornecedor_ingredientes (empresa_id);
create index listas_compra_criado_por_idx on public.listas_compra (criado_por);
create index listas_compra_itens_ingrediente_idx on public.listas_compra_itens (ingrediente_id);
create index pedidos_compra_criado_por_idx on public.pedidos_compra (criado_por);
create index pedidos_compra_solicitacao_origem_idx on public.pedidos_compra (solicitacao_origem_id);
create index pedidos_compra_itens_ingrediente_idx on public.pedidos_compra_itens (ingrediente_id);
create index producoes_planejadas_criado_por_idx on public.producoes_planejadas (criado_por);
create index solicitacoes_compra_criado_por_idx on public.solicitacoes_compra (criado_por);
create index solicitacoes_compra_itens_ingrediente_idx on public.solicitacoes_compra_itens (ingrediente_id);
create index solicitacoes_compra_itens_solicitacao_idx on public.solicitacoes_compra_itens (solicitacao_id);
