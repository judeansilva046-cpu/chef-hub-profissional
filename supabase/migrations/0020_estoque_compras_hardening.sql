-- Hardening de segurança para o schema da Sprint 02 (Estoque, Compras,
-- Planejamento, Lista de Compras), mesma rotina aplicada à Sprint 01
-- (0011/0012): search_path fixo em toda função e superfície de RPC restrita
-- ao mínimo necessário.

alter function public.fn_estoque_lotes_recalcular_saldo() set search_path = public;
alter function public.fn_registrar_entrada_estoque(uuid, numeric, numeric, text, date, text, uuid, text) set search_path = public;
alter function public.fn_registrar_saida_estoque(uuid, numeric, text, text, uuid, text) set search_path = public;
alter function public.fn_concluir_inventario(uuid) set search_path = public;
alter function public.fn_receber_item_pedido_compra(uuid, numeric, text, date) set search_path = public;
alter function public.fn_concluir_producao(uuid) set search_path = public;
alter function public.fn_gerar_lista_compras(uuid, text, date, date) set search_path = public;
alter function public.fn_converter_lista_em_pedidos(uuid) set search_path = public;

-- Trigger interna: nunca chamável via RPC.
revoke execute on function public.fn_estoque_lotes_recalcular_saldo() from public, anon, authenticated;

-- SECURITY DEFINER usada só pela trigger acima — mesmo motivo, sem RPC.
revoke execute on function public.fn_recalcular_estoque_saldo(uuid, uuid) from public, anon;

-- Funções de entrada (chamadas por Server Actions autenticadas): negar
-- "anon" explicitamente é defesa em profundidade (RLS já bloqueia qualquer
-- efeito útil sem sessão, mas reduz a superfície de API exposta).
revoke execute on function public.fn_registrar_entrada_estoque(uuid, numeric, numeric, text, date, text, uuid, text) from public, anon;
revoke execute on function public.fn_registrar_saida_estoque(uuid, numeric, text, text, uuid, text) from public, anon;
revoke execute on function public.fn_concluir_inventario(uuid) from public, anon;
revoke execute on function public.fn_receber_item_pedido_compra(uuid, numeric, text, date) from public, anon;
revoke execute on function public.fn_concluir_producao(uuid) from public, anon;
revoke execute on function public.fn_gerar_lista_compras(uuid, text, date, date) from public, anon;
revoke execute on function public.fn_converter_lista_em_pedidos(uuid) from public, anon;
