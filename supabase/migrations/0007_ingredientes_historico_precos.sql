-- Trilha de auditoria de preço: só cresce, nunca é editada pelo cliente.
create table public.ingredientes_historico_precos (
  id uuid primary key default gen_random_uuid(),
  ingrediente_id uuid not null references public.ingredientes (id) on delete cascade,
  custo_unitario numeric(14, 4) not null check (custo_unitario >= 0),
  data_referencia timestamptz not null default now(),
  criado_por uuid references public.profiles (id),
  observacao text
);

create index ingredientes_historico_precos_ingrediente_idx
  on public.ingredientes_historico_precos (ingrediente_id, data_referencia desc);

alter table public.ingredientes_historico_precos enable row level security;

-- Apenas leitura para o role authenticated. NÃO existe policy de INSERT aqui
-- de propósito: a única forma de gravar histórico é via a trigger abaixo
-- (SECURITY DEFINER), garantindo que cada linha corresponde a uma mudança
-- real em ingredientes.custo_unitario_atual, nunca a uma inserção arbitrária
-- vinda do cliente.
create policy "ingredientes_historico_precos_select_own" on public.ingredientes_historico_precos
  for select using (
    exists (
      select 1
      from public.ingredientes i
      join public.empresas e on e.id = i.empresa_id
      where i.id = ingredientes_historico_precos.ingrediente_id
        and e.usuario_id = auth.uid()
    )
  );

-- SECURITY DEFINER: precisa ignorar RLS para poder inserir aqui, já que não
-- existe (de propósito) policy de INSERT para authenticated nesta tabela.
-- Convenção do projeto: toda função SECURITY DEFINER que grava dados deve
-- reimplementar manualmente a checagem de autorização relevante, porque
-- SECURITY DEFINER ignora RLS por definição. Aqui a checagem é implícita:
-- só dispara em resposta a uma escrita em ingredientes que a RLS de
-- ingredientes já validou.
create function public.registrar_historico_preco_ingrediente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.custo_unitario_atual is distinct from new.custo_unitario_atual then
    insert into public.ingredientes_historico_precos (ingrediente_id, custo_unitario, criado_por)
    values (new.id, new.custo_unitario_atual, auth.uid());
  end if;
  return new;
end;
$$;

create trigger ingredientes_registrar_historico_preco
  after insert or update of custo_unitario_atual on public.ingredientes
  for each row execute function public.registrar_historico_preco_ingrediente();
