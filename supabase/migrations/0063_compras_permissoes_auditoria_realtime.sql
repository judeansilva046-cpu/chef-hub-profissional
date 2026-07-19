-- Sprint 08: Permissões, auditoria, realtime. Reaproveita usuarios_empresa
-- (0043, Financeiro) em vez de criar um segundo mecanismo de convite/
-- membresia — só estende os papéis aceitos. Um usuário continua tendo UM
-- papel por empresa (mesma limitação já aceita pelo Financeiro); 'owner'
-- sempre tem acesso total a tudo, financeiro e compras.
alter table public.usuarios_empresa drop constraint usuarios_empresa_papel_check;
alter table public.usuarios_empresa add constraint usuarios_empresa_papel_check
  check (papel in (
    'owner', 'financeiro', 'operacional', 'leitura',
    'comprador', 'aprovador', 'recebedor', 'solicitante'
  ));

-- Checagem central de acesso ao módulo de Compras — mesmo formato de
-- fn_tem_acesso_financeiro (0043): dono sempre tem acesso total; membro
-- convidado precisa de um papel do módulo (ou 'financeiro', que precisa
-- enxergar compras para conciliar as contas a pagar geradas) para
-- ESCREVER, qualquer papel ativo para LER.
create function public.fn_tem_acesso_compras(p_empresa_id uuid, p_exigir_escrita boolean default true)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.empresas where id = p_empresa_id and usuario_id = auth.uid()
  ) or exists (
    select 1 from public.usuarios_empresa
    where empresa_id = p_empresa_id
      and usuario_id = auth.uid()
      and ativo
      and (
        not p_exigir_escrita
        or papel in ('owner', 'comprador', 'aprovador', 'recebedor', 'solicitante', 'financeiro')
      )
  );
$$;

grant execute on function public.fn_tem_acesso_compras(uuid, boolean) to authenticated;
revoke execute on function public.fn_tem_acesso_compras(uuid, boolean) from public, anon;

-- Perfis visíveis (mesmo motivo/formato de fn_perfis_visiveis_financeiro,
-- 0044): profiles só tem policy "select own" — auditoria, histórico de
-- aprovação e recebimento precisam mostrar QUEM fez cada coisa.
create function public.fn_perfis_visiveis_compras(p_empresa_id uuid)
returns table (id uuid, nome_completo text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome_completo, p.email
  from public.profiles p
  where public.fn_tem_acesso_compras(p_empresa_id, false)
    and (
      p.id in (select usuario_id from public.usuarios_empresa where empresa_id = p_empresa_id)
      or p.id in (select usuario_id from public.empresas where id = p_empresa_id)
      or p.id in (select criado_por from public.solicitacoes_compra where empresa_id = p_empresa_id)
      or p.id in (select criado_por from public.pedidos_compra where empresa_id = p_empresa_id)
      or p.id in (select aprovador_id from public.solicitacoes_compra_aprovacoes where empresa_id = p_empresa_id)
      or p.id in (select responsavel_id from public.compras_recebimentos where empresa_id = p_empresa_id)
    );
$$;

grant execute on function public.fn_perfis_visiveis_compras(uuid) to authenticated;
revoke execute on function public.fn_perfis_visiveis_compras(uuid) from public, anon;

-- Migra as policies das tabelas de Compras de "só dono" para
-- fn_tem_acesso_compras — mesmas tabelas, sem recriar nenhuma (mesma
-- rotina da 0043 para o Financeiro).
drop policy "fornecedores_select_own" on public.fornecedores;
drop policy "fornecedores_insert_own" on public.fornecedores;
drop policy "fornecedores_update_own" on public.fornecedores;
create policy "fornecedores_select" on public.fornecedores
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "fornecedores_insert" on public.fornecedores
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "fornecedores_update" on public.fornecedores
  for update using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "fornecedor_ingredientes_all_own" on public.fornecedor_ingredientes;
create policy "fornecedor_ingredientes_select" on public.fornecedor_ingredientes
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "fornecedor_ingredientes_insert" on public.fornecedor_ingredientes
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "fornecedor_ingredientes_update" on public.fornecedor_ingredientes
  for update using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));
create policy "fornecedor_ingredientes_delete" on public.fornecedor_ingredientes
  for delete using (fn_tem_acesso_compras(empresa_id, true));

drop policy "solicitacoes_compra_select_own" on public.solicitacoes_compra;
drop policy "solicitacoes_compra_insert_own" on public.solicitacoes_compra;
drop policy "solicitacoes_compra_update_own" on public.solicitacoes_compra;
create policy "solicitacoes_compra_select" on public.solicitacoes_compra
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "solicitacoes_compra_insert" on public.solicitacoes_compra
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "solicitacoes_compra_update" on public.solicitacoes_compra
  for update using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "solicitacoes_compra_itens_all_own" on public.solicitacoes_compra_itens;
create policy "solicitacoes_compra_itens_all" on public.solicitacoes_compra_itens
  for all using (
    exists (
      select 1 from public.solicitacoes_compra s
      where s.id = solicitacoes_compra_itens.solicitacao_id
        and fn_tem_acesso_compras(s.empresa_id, true)
    )
  )
  with check (
    exists (
      select 1 from public.solicitacoes_compra s
      where s.id = solicitacoes_compra_itens.solicitacao_id
        and fn_tem_acesso_compras(s.empresa_id, true)
    )
  );

drop policy "pedidos_compra_select_own" on public.pedidos_compra;
drop policy "pedidos_compra_insert_own" on public.pedidos_compra;
drop policy "pedidos_compra_update_own" on public.pedidos_compra;
create policy "pedidos_compra_select" on public.pedidos_compra
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "pedidos_compra_insert" on public.pedidos_compra
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "pedidos_compra_update" on public.pedidos_compra
  for update using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "pedidos_compra_itens_select_own" on public.pedidos_compra_itens;
drop policy "pedidos_compra_itens_insert_own" on public.pedidos_compra_itens;
drop policy "pedidos_compra_itens_update_own" on public.pedidos_compra_itens;
create policy "pedidos_compra_itens_select" on public.pedidos_compra_itens
  for select using (
    exists (select 1 from public.pedidos_compra p where p.id = pedidos_compra_itens.pedido_id and fn_tem_acesso_compras(p.empresa_id, false))
  );
create policy "pedidos_compra_itens_insert" on public.pedidos_compra_itens
  for insert with check (
    exists (select 1 from public.pedidos_compra p where p.id = pedidos_compra_itens.pedido_id and fn_tem_acesso_compras(p.empresa_id, true))
  );
create policy "pedidos_compra_itens_update" on public.pedidos_compra_itens
  for update using (
    exists (select 1 from public.pedidos_compra p where p.id = pedidos_compra_itens.pedido_id and fn_tem_acesso_compras(p.empresa_id, true))
  )
  with check (
    exists (select 1 from public.pedidos_compra p where p.id = pedidos_compra_itens.pedido_id and fn_tem_acesso_compras(p.empresa_id, true))
  );

drop policy "compras_niveis_aprovacao_select_own" on public.compras_niveis_aprovacao;
drop policy "compras_niveis_aprovacao_insert_own" on public.compras_niveis_aprovacao;
drop policy "compras_niveis_aprovacao_update_own" on public.compras_niveis_aprovacao;
drop policy "compras_niveis_aprovacao_delete_own" on public.compras_niveis_aprovacao;
create policy "compras_niveis_aprovacao_select" on public.compras_niveis_aprovacao
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "compras_niveis_aprovacao_insert" on public.compras_niveis_aprovacao
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "compras_niveis_aprovacao_update" on public.compras_niveis_aprovacao
  for update using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));
create policy "compras_niveis_aprovacao_delete" on public.compras_niveis_aprovacao
  for delete using (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_cotacoes_select_own" on public.compras_cotacoes;
drop policy "compras_cotacoes_insert_own" on public.compras_cotacoes;
drop policy "compras_cotacoes_update_own" on public.compras_cotacoes;
create policy "compras_cotacoes_select" on public.compras_cotacoes
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "compras_cotacoes_insert" on public.compras_cotacoes
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "compras_cotacoes_update" on public.compras_cotacoes
  for update using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_cotacoes_itens_all_own" on public.compras_cotacoes_itens;
create policy "compras_cotacoes_itens_all" on public.compras_cotacoes_itens
  for all using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_cotacoes_fornecedores_all_own" on public.compras_cotacoes_fornecedores;
create policy "compras_cotacoes_fornecedores_all" on public.compras_cotacoes_fornecedores
  for all using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_cotacoes_propostas_itens_all_own" on public.compras_cotacoes_propostas_itens;
create policy "compras_cotacoes_propostas_itens_all" on public.compras_cotacoes_propostas_itens
  for all using (fn_tem_acesso_compras(empresa_id, true))
  with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_anexos_select_own" on public.compras_anexos;
drop policy "compras_anexos_insert_own" on public.compras_anexos;
drop policy "compras_anexos_delete_own" on public.compras_anexos;
create policy "compras_anexos_select" on public.compras_anexos
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "compras_anexos_insert" on public.compras_anexos
  for insert with check (fn_tem_acesso_compras(empresa_id, true));
create policy "compras_anexos_delete" on public.compras_anexos
  for delete using (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_avaliacoes_fornecedor_select_own" on public.compras_avaliacoes_fornecedor;
drop policy "compras_avaliacoes_fornecedor_insert_own" on public.compras_avaliacoes_fornecedor;
create policy "compras_avaliacoes_fornecedor_select" on public.compras_avaliacoes_fornecedor
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "compras_avaliacoes_fornecedor_insert" on public.compras_avaliacoes_fornecedor
  for insert with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_recebimentos_select_own" on public.compras_recebimentos;
drop policy "compras_recebimentos_insert_own" on public.compras_recebimentos;
create policy "compras_recebimentos_select" on public.compras_recebimentos
  for select using (fn_tem_acesso_compras(empresa_id, false));
create policy "compras_recebimentos_insert" on public.compras_recebimentos
  for insert with check (fn_tem_acesso_compras(empresa_id, true));

drop policy "compras_recebimentos_itens_select_own" on public.compras_recebimentos_itens;
create policy "compras_recebimentos_itens_select" on public.compras_recebimentos_itens
  for select using (fn_tem_acesso_compras(empresa_id, false));

-- Correção: fn_registrar_recebimento_item (0061) grava em
-- compras_recebimentos_itens, que não tem policy de INSERT para
-- authenticated (só esta função escreve lá) — precisa ser SECURITY
-- DEFINER para conseguir, com a checagem de acesso repetida manualmente
-- logo no início (SECURITY DEFINER ignora RLS por definição, então as
-- chamadas internas a fn_receber_item_pedido_compra/
-- fn_registrar_recusa_item_pedido_compra também passam a rodar com este
-- privilégio elevado — por isso a checagem aqui precisa cobrir tudo).
create or replace function public.fn_registrar_recebimento_item(
  p_pedido_item_id uuid,
  p_quantidade_recebida numeric default 0,
  p_quantidade_recusada numeric default 0,
  p_preco_conferido numeric default null,
  p_numero_lote text default null,
  p_data_fabricacao date default null,
  p_data_validade date default null,
  p_motivo_divergencia text default null,
  p_recebimento_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.pedidos_compra_itens%rowtype;
  v_empresa_id uuid;
  v_recebimento_id uuid;
  v_divergencia boolean;
begin
  select * into v_item from public.pedidos_compra_itens where id = p_pedido_item_id;
  if not found then
    raise exception 'Item de pedido de compra não encontrado';
  end if;

  select empresa_id into v_empresa_id from public.pedidos_compra where id = v_item.pedido_id;

  if not public.fn_tem_acesso_compras(v_empresa_id, true) then
    raise exception 'Sem permissão para registrar recebimento nesta empresa.';
  end if;

  if p_quantidade_recebida <= 0 and p_quantidade_recusada <= 0 then
    raise exception 'Informe alguma quantidade recebida ou recusada';
  end if;

  v_divergencia := p_quantidade_recusada > 0
    or (p_preco_conferido is not null and p_preco_conferido is distinct from v_item.preco_unitario)
    or (p_motivo_divergencia is not null and btrim(p_motivo_divergencia) <> '');

  if p_recebimento_id is not null then
    v_recebimento_id := p_recebimento_id;
  else
    insert into public.compras_recebimentos (empresa_id, pedido_id, responsavel_id)
    values (v_empresa_id, v_item.pedido_id, auth.uid())
    returning id into v_recebimento_id;
  end if;

  if p_quantidade_recebida > 0 then
    perform public.fn_receber_item_pedido_compra(p_pedido_item_id, p_quantidade_recebida, p_numero_lote, p_data_validade);
  end if;

  if p_quantidade_recusada > 0 then
    perform public.fn_registrar_recusa_item_pedido_compra(
      p_pedido_item_id, p_quantidade_recusada, coalesce(p_motivo_divergencia, 'Recusado na conferência')
    );
  end if;

  insert into public.compras_recebimentos_itens (
    empresa_id, recebimento_id, pedido_item_id, quantidade_recebida, quantidade_recusada,
    preco_conferido, numero_lote, data_fabricacao, data_validade, divergencia, motivo_divergencia
  ) values (
    v_empresa_id, v_recebimento_id, p_pedido_item_id, p_quantidade_recebida, p_quantidade_recusada,
    p_preco_conferido, p_numero_lote, p_data_fabricacao, p_data_validade, v_divergencia, p_motivo_divergencia
  );

  if v_divergencia then
    perform public.fn_notificar_divergencia_recebimento(
      v_empresa_id, v_item.pedido_id,
      'Divergência registrada no recebimento do pedido de compra'
    );
  end if;

  return v_recebimento_id;
end;
$$;

grant execute on function public.fn_registrar_recebimento_item(uuid, numeric, numeric, numeric, text, date, date, text, uuid) to authenticated;
revoke execute on function public.fn_registrar_recebimento_item(uuid, numeric, numeric, numeric, text, date, date, text, uuid) from public, anon;

-- Auditoria genérica — mesmo padrão de financeiro_auditoria (0043) e
-- crm_auditoria (0053): uma trigger reaproveitável via TG_TABLE_NAME/TG_OP.
create table public.compras_auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  dados_antigos jsonb,
  dados_novos jsonb,
  usuario_id uuid references public.profiles (id),
  criado_em timestamptz not null default now()
);

create index compras_auditoria_empresa_idx on public.compras_auditoria (empresa_id, criado_em desc);
create index compras_auditoria_registro_idx on public.compras_auditoria (tabela, registro_id);

alter table public.compras_auditoria enable row level security;

create policy "compras_auditoria_select" on public.compras_auditoria
  for select using (fn_tem_acesso_compras(empresa_id, false));

create function public.fn_registrar_auditoria_compras()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.compras_auditoria (
    empresa_id, tabela, registro_id, acao, dados_antigos, dados_novos, usuario_id
  ) values (
    coalesce(new.empresa_id, old.empresa_id),
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    lower(TG_OP),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create trigger fornecedores_auditoria_compras
  after insert or update on public.fornecedores
  for each row execute function public.fn_registrar_auditoria_compras();
create trigger solicitacoes_compra_auditoria
  after insert or update on public.solicitacoes_compra
  for each row execute function public.fn_registrar_auditoria_compras();
create trigger compras_cotacoes_auditoria
  after insert or update on public.compras_cotacoes
  for each row execute function public.fn_registrar_auditoria_compras();
create trigger pedidos_compra_auditoria_compras
  after insert or update on public.pedidos_compra
  for each row execute function public.fn_registrar_auditoria_compras();
create trigger compras_niveis_aprovacao_auditoria
  after insert or update on public.compras_niveis_aprovacao
  for each row execute function public.fn_registrar_auditoria_compras();
create trigger compras_recebimentos_auditoria
  after insert on public.compras_recebimentos
  for each row execute function public.fn_registrar_auditoria_compras();

-- Realtime: só nas telas colaborativas onde múltiplos operadores mudando
-- ao mesmo tempo é visível na prática (aprovação de solicitações, cotação
-- recebendo propostas, acompanhamento de pedidos, sino de notificações) —
-- mesmo critério seletivo da 0037/0053, não uma extensão geral.
alter publication supabase_realtime add table public.solicitacoes_compra;
alter publication supabase_realtime add table public.compras_cotacoes;
alter publication supabase_realtime add table public.pedidos_compra;
alter publication supabase_realtime add table public.compras_notificacoes;
