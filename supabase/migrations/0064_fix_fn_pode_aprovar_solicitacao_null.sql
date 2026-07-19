-- Sprint 08 (fix pós-teste): fn_pode_aprovar_solicitacao (0057) podia
-- retornar NULL em vez de false quando o chamador não tem nenhuma linha em
-- usuarios_empresa para a empresa (comparação `v_papel = 'aprovador'` com
-- v_papel nulo). Na prática isso já era inofensivo — o app trata com
-- `?? false` (podeAprovarSolicitacao, queries.ts) e fn_aprovar_solicitacao_
-- compra/fn_rejeitar_solicitacao_compra/fn_solicitar_ajuste_solicitacao_
-- compra já bloqueiam antes disso, no gate de posse/vínculo com a empresa —
-- mas a função deve sempre devolver um boolean não-nulo, então corrige aqui.
create or replace function public.fn_pode_aprovar_solicitacao(p_solicitacao_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_solicitacao record;
  v_valor numeric(14, 2);
  v_nivel public.compras_niveis_aprovacao;
  v_dono boolean;
  v_papel text;
begin
  select s.empresa_id, s.centro_custo_id into v_solicitacao
  from public.solicitacoes_compra s where s.id = p_solicitacao_id;

  if v_solicitacao.empresa_id is null then
    return false;
  end if;

  select exists(select 1 from public.empresas where id = v_solicitacao.empresa_id and usuario_id = auth.uid())
    into v_dono;
  if v_dono then
    return true;
  end if;

  select coalesce(sum(i.quantidade * i.preco_estimado), 0) into v_valor
  from public.solicitacoes_compra_itens i where i.solicitacao_id = p_solicitacao_id;

  select * into v_nivel
  from public.fn_nivel_aprovacao_aplicavel(v_solicitacao.empresa_id, v_valor, v_solicitacao.centro_custo_id);

  select papel into v_papel from public.usuarios_empresa
  where empresa_id = v_solicitacao.empresa_id and usuario_id = auth.uid() and ativo;

  if v_nivel.id is null then
    return coalesce(v_papel = 'aprovador', false);
  end if;

  if v_nivel.usuario_aprovador_id is not null then
    return coalesce(v_nivel.usuario_aprovador_id = auth.uid(), false);
  end if;

  return coalesce(v_papel = v_nivel.papel_aprovador, false);
end;
$$;
