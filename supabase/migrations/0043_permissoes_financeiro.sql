-- Sprint 06: Permissões — até aqui, "dono da empresa" (empresas.usuario_id)
-- era o único conceito de acesso no projeto inteiro. O módulo Financeiro
-- introduz multiusuário por empresa (ex: um contador com acesso só a
-- leitura, um financeiro que lança contas sem poder editar fichas técnicas)
-- — escopo deliberadamente limitado às tabelas do Financeiro desta sprint,
-- não uma reforma de RLS do projeto inteiro.
create table public.usuarios_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  usuario_id uuid not null references public.profiles (id) on delete cascade,
  papel text not null default 'leitura' check (papel in ('owner', 'financeiro', 'operacional', 'leitura')),
  ativo boolean not null default true,
  convidado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);

create index usuarios_empresa_empresa_idx on public.usuarios_empresa (empresa_id, ativo);
create index usuarios_empresa_usuario_idx on public.usuarios_empresa (usuario_id);

alter table public.usuarios_empresa enable row level security;

-- Um membro vê a própria linha; o dono da empresa vê todos os membros.
create policy "usuarios_empresa_select" on public.usuarios_empresa
  for select using (
    usuario_id = (select auth.uid())
    or empresa_id in (select id from public.empresas where usuario_id = (select auth.uid()))
  );
-- Só o dono gerencia membros (convidar/mudar papel/desativar) — nunca um
-- membro a si mesmo (evitaria auto-promoção a 'owner').
create policy "usuarios_empresa_insert_dono" on public.usuarios_empresa
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "usuarios_empresa_update_dono" on public.usuarios_empresa
  for update using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())))
  with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create trigger usuarios_empresa_set_atualizado_em
  before update on public.usuarios_empresa
  for each row execute function public.set_atualizado_em();

-- Checagem central de acesso ao Financeiro: dono da empresa sempre tem
-- acesso total; membro convidado precisa de papel 'owner'/'financeiro' para
-- escrever, qualquer papel ativo (incl. 'leitura') para ler.
-- SECURITY DEFINER: só retorna um boolean, nunca expõe linha nenhuma — não
-- há risco em bypassar RLS de usuarios_empresa aqui dentro.
create function public.fn_tem_acesso_financeiro(p_empresa_id uuid, p_exigir_escrita boolean default true)
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
      and (not p_exigir_escrita or papel in ('owner', 'financeiro'))
  );
$$;

grant execute on function public.fn_tem_acesso_financeiro(uuid, boolean) to authenticated;
revoke execute on function public.fn_tem_acesso_financeiro(uuid, boolean) from public, anon;

-- Troca as policies das tabelas do Financeiro (0040-0042) de "só dono" para
-- fn_tem_acesso_financeiro — mesmas tabelas, sem recriar nenhuma.
drop policy "plano_contas_select_own" on public.plano_contas;
drop policy "plano_contas_insert_own" on public.plano_contas;
drop policy "plano_contas_update_own" on public.plano_contas;
create policy "plano_contas_select" on public.plano_contas
  for select using (fn_tem_acesso_financeiro(empresa_id, false));
create policy "plano_contas_insert" on public.plano_contas
  for insert with check (fn_tem_acesso_financeiro(empresa_id, true));
create policy "plano_contas_update" on public.plano_contas
  for update using (fn_tem_acesso_financeiro(empresa_id, true))
  with check (fn_tem_acesso_financeiro(empresa_id, true));

drop policy "centros_custo_select_own" on public.centros_custo;
drop policy "centros_custo_insert_own" on public.centros_custo;
drop policy "centros_custo_update_own" on public.centros_custo;
create policy "centros_custo_select" on public.centros_custo
  for select using (fn_tem_acesso_financeiro(empresa_id, false));
create policy "centros_custo_insert" on public.centros_custo
  for insert with check (fn_tem_acesso_financeiro(empresa_id, true));
create policy "centros_custo_update" on public.centros_custo
  for update using (fn_tem_acesso_financeiro(empresa_id, true))
  with check (fn_tem_acesso_financeiro(empresa_id, true));

drop policy "contas_pagar_select_own" on public.contas_pagar;
drop policy "contas_pagar_insert_own" on public.contas_pagar;
drop policy "contas_pagar_update_own" on public.contas_pagar;
create policy "contas_pagar_select" on public.contas_pagar
  for select using (fn_tem_acesso_financeiro(empresa_id, false));
create policy "contas_pagar_insert" on public.contas_pagar
  for insert with check (fn_tem_acesso_financeiro(empresa_id, true));
create policy "contas_pagar_update" on public.contas_pagar
  for update using (fn_tem_acesso_financeiro(empresa_id, true))
  with check (fn_tem_acesso_financeiro(empresa_id, true));

drop policy "contas_receber_select_own" on public.contas_receber;
drop policy "contas_receber_insert_own" on public.contas_receber;
drop policy "contas_receber_update_own" on public.contas_receber;
create policy "contas_receber_select" on public.contas_receber
  for select using (fn_tem_acesso_financeiro(empresa_id, false));
create policy "contas_receber_insert" on public.contas_receber
  for insert with check (fn_tem_acesso_financeiro(empresa_id, true));
create policy "contas_receber_update" on public.contas_receber
  for update using (fn_tem_acesso_financeiro(empresa_id, true))
  with check (fn_tem_acesso_financeiro(empresa_id, true));

drop policy "contas_receber_parcelas_select_own" on public.contas_receber_parcelas;
drop policy "contas_receber_parcelas_update_own" on public.contas_receber_parcelas;
create policy "contas_receber_parcelas_select" on public.contas_receber_parcelas
  for select using (fn_tem_acesso_financeiro(empresa_id, false));
-- Correção da 0042: fn_criar_conta_receber é SECURITY INVOKER, então o
-- INSERT de parcelas dentro dela roda como o usuário chamador — sem esta
-- policy, ficaria bloqueado por RLS mesmo vindo da função "única porta de
-- entrada" (mesmo bug já corrigido para contadores_pedidos na Sprint 05).
create policy "contas_receber_parcelas_insert" on public.contas_receber_parcelas
  for insert with check (fn_tem_acesso_financeiro(empresa_id, true));
create policy "contas_receber_parcelas_update" on public.contas_receber_parcelas
  for update using (fn_tem_acesso_financeiro(empresa_id, true))
  with check (fn_tem_acesso_financeiro(empresa_id, true));

-- Auditoria: log append-only das tabelas do Financeiro — reaproveita o
-- padrão de pedido_status_historico (Sprint 05, gravado só por trigger,
-- nunca escrita direta do cliente) generalizado para qualquer tabela via
-- TG_TABLE_NAME/TG_OP, em vez de uma trigger dedicada por tabela.
create table public.financeiro_auditoria (
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

create index financeiro_auditoria_empresa_idx on public.financeiro_auditoria (empresa_id, criado_em desc);
create index financeiro_auditoria_registro_idx on public.financeiro_auditoria (tabela, registro_id);

alter table public.financeiro_auditoria enable row level security;

create policy "financeiro_auditoria_select" on public.financeiro_auditoria
  for select using (fn_tem_acesso_financeiro(empresa_id, false));

create function public.fn_registrar_auditoria_financeira()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.financeiro_auditoria (
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

create trigger plano_contas_auditoria
  after insert or update or delete on public.plano_contas
  for each row execute function public.fn_registrar_auditoria_financeira();
create trigger centros_custo_auditoria
  after insert or update or delete on public.centros_custo
  for each row execute function public.fn_registrar_auditoria_financeira();
create trigger contas_pagar_auditoria
  after insert or update or delete on public.contas_pagar
  for each row execute function public.fn_registrar_auditoria_financeira();
create trigger contas_receber_auditoria
  after insert or update or delete on public.contas_receber
  for each row execute function public.fn_registrar_auditoria_financeira();
create trigger contas_receber_parcelas_auditoria
  after insert or update or delete on public.contas_receber_parcelas
  for each row execute function public.fn_registrar_auditoria_financeira();
