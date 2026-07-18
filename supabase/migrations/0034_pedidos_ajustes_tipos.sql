-- Ajustes de tipagem para geração correta de TypeScript (Supabase só marca
-- uma coluna/parâmetro como opcional no tipo gerado quando ela tem DEFAULT —
-- não sabe sobre triggers). Sem isso, o Insert de pedidos exigiria `numero`
-- do cliente (que é sempre sobrescrito pela trigger) e o RPC de pagamento
-- exigiria `p_caixa_id` obrigatório mesmo quando o pedido não está vinculado
-- a nenhum caixa aberto.

-- Mesmo princípio de vendas.custo_unitario_snapshot (0027): valor default
-- inócuo (0) só para o Insert type ficar opcional — a trigger abaixo
-- continua sendo a única fonte real do valor, agora incondicional (nunca
-- confia no default nem em um valor eventualmente enviado pelo cliente).
alter table public.pedidos alter column numero set default 0;

create or replace function public.pedidos_definir_numero()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.numero := public.fn_proximo_numero_pedido(new.empresa_id);
  return new;
end;
$$;

-- p_caixa_id passa a ter default null (pagamento pode ser registrado sem
-- caixa vinculado, ex: nenhum caixa aberto no momento) — reordenado para
-- depois dos parâmetros realmente obrigatórios (SQL exige que todo parâmetro
-- com DEFAULT venha depois dos sem default), por isso DROP + CREATE em vez
-- de CREATE OR REPLACE (mudar a ordem dos parâmetros muda a assinatura).
drop function if exists public.fn_registrar_pagamento_pedido(uuid, uuid, text, numeric, numeric, text);

create function public.fn_registrar_pagamento_pedido(
  p_pedido_id uuid,
  p_forma_pagamento text,
  p_valor numeric,
  p_caixa_id uuid default null,
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
  uuid, text, numeric, uuid, numeric, text
) to authenticated;
revoke execute on function public.fn_registrar_pagamento_pedido(
  uuid, text, numeric, uuid, numeric, text
) from public, anon;
