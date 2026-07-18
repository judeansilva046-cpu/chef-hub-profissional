-- Sprint 05 (checkpoint 2): habilita Supabase Realtime (postgres_changes)
-- nas tabelas que KDS/Mesas/Expedição/Caixa/fila de impressão precisam
-- observar em tempo real. Realtime é 100% greenfield neste projeto — só
-- configuração de publicação, nenhuma tabela nova; a autorização por linha
-- continua sendo a MESMA RLS que já protege cada tabela (o Realtime do
-- Supabase respeita RLS quando o cliente está autenticado), então nenhuma
-- policy nova é necessária.
alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.pedido_status_historico;
alter publication supabase_realtime add table public.mesas;
alter publication supabase_realtime add table public.comandas;
alter publication supabase_realtime add table public.caixas;
alter publication supabase_realtime add table public.expedicoes;
alter publication supabase_realtime add table public.fila_impressao;
