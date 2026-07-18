-- Sprint 05: pagamentos de pedidos. Suporta múltiplas formas no mesmo
-- pedido (várias linhas por pedido_id). Append-only, mesmo padrão de
-- estoque_movimentacoes (0013) — pagamento errado se corrige cancelando o
-- pedido (fn_cancelar_pedido, 0033), não editando o registro financeiro.
create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  caixa_id uuid references public.caixas (id) on delete set null,
  forma_pagamento text not null check (
    forma_pagamento in ('dinheiro', 'pix', 'debito', 'credito', 'vale', 'pagamento_entrega')
  ),
  valor numeric(14, 2) not null check (valor > 0),
  troco_para numeric(14, 2) check (troco_para is null or troco_para >= 0),
  observacao text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index pagamentos_pedido_idx on public.pagamentos (pedido_id);
create index pagamentos_caixa_idx on public.pagamentos (caixa_id) where caixa_id is not null;

alter table public.pagamentos enable row level security;

create policy "pagamentos_select_own" on public.pagamentos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
-- Necessária mesmo com fn_registrar_pagamento_pedido abaixo sendo o único
-- caminho de escrita real (chamado pelas Server Actions): a função roda
-- SECURITY INVOKER, então o INSERT dela ainda passa pela RLS normal do
-- usuário autenticado — sem esta policy, a inserção seria bloqueada.
create policy "pagamentos_insert_own" on public.pagamentos
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create function public.fn_registrar_pagamento_pedido(
  p_pedido_id uuid,
  p_caixa_id uuid,
  p_forma_pagamento text,
  p_valor numeric,
  p_troco_para numeric default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
  v_pagamento_id uuid;
begin
  if p_valor <= 0 then
    raise exception 'Valor do pagamento deve ser maior que zero';
  end if;

  select * into v_pedido from public.pedidos where id = p_pedido_id;
  if not found then
    raise exception 'Pedido não encontrado';
  end if;
  if v_pedido.status = 'cancelado' then
    raise exception 'Pedido está cancelado';
  end if;

  insert into public.pagamentos (
    empresa_id, pedido_id, caixa_id, forma_pagamento, valor, troco_para, observacao, criado_por
  ) values (
    v_pedido.empresa_id, p_pedido_id, p_caixa_id, p_forma_pagamento, p_valor, p_troco_para, p_observacao, auth.uid()
  )
  returning id into v_pagamento_id;

  if p_caixa_id is not null then
    perform public.fn_registrar_movimentacao_caixa(
      p_caixa_id, 'venda', p_valor, p_forma_pagamento, 'pedido', p_pedido_id,
      'Pagamento do pedido #' || v_pedido.numero
    );
  end if;

  return v_pagamento_id;
end;
$$;

grant execute on function public.fn_registrar_pagamento_pedido(
  uuid, uuid, text, numeric, numeric, text
) to authenticated;
revoke execute on function public.fn_registrar_pagamento_pedido(
  uuid, uuid, text, numeric, numeric, text
) from public, anon;
