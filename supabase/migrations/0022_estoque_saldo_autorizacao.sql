-- fn_recalcular_estoque_saldo precisa continuar executável por
-- "authenticated" (é chamada internamente pela trigger
-- fn_estoque_lotes_recalcular_saldo, que roda como SECURITY INVOKER — ou
-- seja, como o próprio usuário autenticado que disparou o INSERT/UPDATE/
-- DELETE em estoque_lotes). Por isso, diferente das outras funções
-- SECURITY DEFINER "internas" desta sprint, esta não pode ter EXECUTE
-- revogado de authenticated. Em compensação, precisa (e antes não tinha)
-- validar manualmente que o ingrediente pertence à empresa informada e que
-- a empresa pertence ao usuário atual — sem isso, um usuário autenticado
-- poderia chamar a função via RPC com o empresa_id de outra empresa sua
-- (não de terceiros, já que ele só pode ser dono de suas próprias
-- empresas) mas apontando para um ingrediente de OUTRA empresa, poluindo
-- estoque_saldos com dados de um ingrediente que não pertence a ela.
create or replace function public.fn_recalcular_estoque_saldo(p_ingrediente_id uuid, p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quantidade numeric(14, 4);
  v_custo_medio numeric(14, 4);
begin
  if not exists (
    select 1 from public.ingredientes
    where id = p_ingrediente_id and empresa_id = p_empresa_id
  ) then
    raise exception 'Ingrediente não pertence à empresa informada';
  end if;

  if not exists (
    select 1 from public.empresas where id = p_empresa_id and usuario_id = auth.uid()
  ) then
    raise exception 'Empresa não pertence ao usuário atual';
  end if;

  select
    coalesce(sum(quantidade_atual), 0),
    case when coalesce(sum(quantidade_atual), 0) > 0
      then sum(quantidade_atual * custo_unitario) / sum(quantidade_atual)
      else 0
    end
  into v_quantidade, v_custo_medio
  from public.estoque_lotes
  where ingrediente_id = p_ingrediente_id and quantidade_atual > 0;

  insert into public.estoque_saldos (empresa_id, ingrediente_id, quantidade_total, custo_medio_ponderado, atualizado_em)
  values (p_empresa_id, p_ingrediente_id, v_quantidade, v_custo_medio, now())
  on conflict (empresa_id, ingrediente_id)
  do update set
    quantidade_total = excluded.quantidade_total,
    custo_medio_ponderado = excluded.custo_medio_ponderado,
    atualizado_em = now();
end;
$$;
