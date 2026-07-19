-- Sprint 08: Recebimento de mercadorias — enriquece o recebimento simples
-- da 0017 (só quantidade + lote + validade) com conferência de preço, data
-- de fabricação, recusa parcial, divergência e responsável explícito, sem
-- duplicar a entrada em estoque já resolvida por fn_receber_item_pedido_compra
-- (0017) / fn_registrar_entrada_estoque (0014).

-- Quantidade que nunca vai ser recebida (recusada na conferência) — sem
-- isso, um pedido com item parcialmente recusado nunca fecharia como
-- 'recebido' (fn_receber_item_pedido_compra só olhava quantidade_recebida
-- vs quantidade_pedida).
alter table public.pedidos_compra_itens
  add column quantidade_recusada numeric(14, 4) not null default 0 check (quantidade_recusada >= 0);

-- CREATE OR REPLACE: mesma função da 0017, só corrigindo o critério de
-- "pedido totalmente resolvido" para considerar recusa também (recebida +
-- recusada, não só recebida) — não duplica a função, atualiza a única que
-- já existe.
create or replace function public.fn_receber_item_pedido_compra(
  p_pedido_item_id uuid,
  p_quantidade numeric,
  p_numero_lote text default null,
  p_data_validade date default null
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_item public.pedidos_compra_itens%rowtype;
  v_pedido public.pedidos_compra%rowtype;
  v_total_pedido numeric(14, 4);
  v_total_resolvido numeric(14, 4);
begin
  select * into v_item from public.pedidos_compra_itens where id = p_pedido_item_id;
  if not found then
    raise exception 'Item de pedido de compra não encontrado';
  end if;

  if p_quantidade <= 0 then
    raise exception 'Quantidade recebida deve ser maior que zero';
  end if;
  if v_item.quantidade_recebida + v_item.quantidade_recusada + p_quantidade > v_item.quantidade_pedida then
    raise exception 'Quantidade recebida excede a quantidade pedida';
  end if;

  select * into v_pedido from public.pedidos_compra where id = v_item.pedido_id;

  update public.pedidos_compra_itens
  set quantidade_recebida = quantidade_recebida + p_quantidade
  where id = p_pedido_item_id;

  perform public.fn_registrar_entrada_estoque(
    v_item.ingrediente_id, p_quantidade, v_item.preco_unitario,
    p_numero_lote, p_data_validade, 'compra', v_pedido.id,
    'Recebimento do pedido de compra'
  );

  select coalesce(sum(quantidade_pedida), 0), coalesce(sum(quantidade_recebida + quantidade_recusada), 0)
    into v_total_pedido, v_total_resolvido
  from public.pedidos_compra_itens
  where pedido_id = v_pedido.id;

  update public.pedidos_compra
  set status = case
        when v_total_resolvido >= v_total_pedido then 'recebido'
        when v_total_resolvido > 0 then 'parcialmente_recebido'
        else status
      end
  where id = v_pedido.id;
end;
$$;

grant execute on function public.fn_receber_item_pedido_compra(uuid, numeric, text, date) to authenticated;
revoke execute on function public.fn_receber_item_pedido_compra(uuid, numeric, text, date) from public, anon;

-- Recusa (sem entrada em estoque) — mesmo critério de fechamento do pedido.
create function public.fn_registrar_recusa_item_pedido_compra(
  p_pedido_item_id uuid,
  p_quantidade numeric,
  p_motivo text
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_item public.pedidos_compra_itens%rowtype;
  v_total_pedido numeric(14, 4);
  v_total_resolvido numeric(14, 4);
begin
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Informe o motivo da recusa';
  end if;

  select * into v_item from public.pedidos_compra_itens where id = p_pedido_item_id;
  if not found then
    raise exception 'Item de pedido de compra não encontrado';
  end if;

  if p_quantidade <= 0 then
    raise exception 'Quantidade recusada deve ser maior que zero';
  end if;
  if v_item.quantidade_recebida + v_item.quantidade_recusada + p_quantidade > v_item.quantidade_pedida then
    raise exception 'Quantidade recusada excede a quantidade pedida';
  end if;

  update public.pedidos_compra_itens
  set quantidade_recusada = quantidade_recusada + p_quantidade
  where id = p_pedido_item_id;

  select coalesce(sum(quantidade_pedida), 0), coalesce(sum(quantidade_recebida + quantidade_recusada), 0)
    into v_total_pedido, v_total_resolvido
  from public.pedidos_compra_itens
  where pedido_id = v_item.pedido_id;

  update public.pedidos_compra
  set status = case
        when v_total_resolvido >= v_total_pedido then 'recebido'
        when v_total_resolvido > 0 then 'parcialmente_recebido'
        else status
      end
  where id = v_item.pedido_id;
end;
$$;

grant execute on function public.fn_registrar_recusa_item_pedido_compra(uuid, numeric, text) to authenticated;
revoke execute on function public.fn_registrar_recusa_item_pedido_compra(uuid, numeric, text) from public, anon;

-- Cabeçalho do evento de recebimento (um recebimento físico pode cobrir
-- vários itens do pedido de uma vez) — rastreabilidade completa de quem
-- recebeu e quando, item a item.
create table public.compras_recebimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  pedido_id uuid not null references public.pedidos_compra (id) on delete cascade,
  responsavel_id uuid references public.profiles (id),
  data_recebimento date not null default current_date,
  observacao text,
  criado_em timestamptz not null default now()
);

create index compras_recebimentos_pedido_idx on public.compras_recebimentos (pedido_id, criado_em desc);

alter table public.compras_recebimentos enable row level security;

create policy "compras_recebimentos_select_own" on public.compras_recebimentos
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
create policy "compras_recebimentos_insert_own" on public.compras_recebimentos
  for insert with check (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));

create table public.compras_recebimentos_itens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  recebimento_id uuid not null references public.compras_recebimentos (id) on delete cascade,
  pedido_item_id uuid not null references public.pedidos_compra_itens (id) on delete restrict,
  quantidade_recebida numeric(14, 4) not null default 0 check (quantidade_recebida >= 0),
  quantidade_recusada numeric(14, 4) not null default 0 check (quantidade_recusada >= 0),
  preco_conferido numeric(14, 4),
  numero_lote text,
  data_fabricacao date,
  data_validade date,
  divergencia boolean not null default false,
  motivo_divergencia text,
  constraint compras_recebimentos_itens_alguma_quantidade
    check (quantidade_recebida > 0 or quantidade_recusada > 0)
);

create index compras_recebimentos_itens_recebimento_idx on public.compras_recebimentos_itens (recebimento_id);
create index compras_recebimentos_itens_pedido_item_idx on public.compras_recebimentos_itens (pedido_item_id);
create index compras_recebimentos_itens_divergencia_idx
  on public.compras_recebimentos_itens (empresa_id) where divergencia;

alter table public.compras_recebimentos_itens enable row level security;

create policy "compras_recebimentos_itens_select_own" on public.compras_recebimentos_itens
  for select using (empresa_id in (select id from public.empresas where usuario_id = (select auth.uid())));
-- Sem policy de INSERT: só fn_registrar_recebimento_item (abaixo) grava
-- aqui, porque ela também precisa acionar fn_receber_item_pedido_compra/
-- fn_registrar_recusa_item_pedido_compra na mesma transação — mantendo o
-- "único caminho de escrita" também para o detalhamento do recebimento.

create function public.fn_notificar_divergencia_recebimento(p_empresa_id uuid, p_pedido_id uuid, p_mensagem text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dono_id uuid;
begin
  select usuario_id into v_dono_id from public.empresas where id = p_empresa_id;

  insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
  select p_empresa_id, v_dono_id, 'divergencia_recebimento', p_mensagem, 'pedido_compra', p_pedido_id
  where v_dono_id is not null;

  insert into public.compras_notificacoes (empresa_id, usuario_id, tipo, mensagem, referencia_tipo, referencia_id)
  select p_empresa_id, ue.usuario_id, 'divergencia_recebimento', p_mensagem, 'pedido_compra', p_pedido_id
  from public.usuarios_empresa ue
  where ue.empresa_id = p_empresa_id and ue.papel in ('recebedor', 'comprador') and ue.ativo
    and ue.usuario_id is distinct from v_dono_id;
end;
$$;

revoke execute on function public.fn_notificar_divergencia_recebimento(uuid, uuid, text) from public, anon, authenticated;

-- Ponto único de escrita do recebimento detalhado: cria (ou reaproveita) o
-- cabeçalho, aciona a entrada em estoque / recusa via as funções já
-- existentes (nunca duplica a lógica de FIFO), grava a linha de
-- conferência e notifica em caso de divergência. SECURITY INVOKER: toda
-- escrita já é permitida pela RLS do próprio usuário (mesmo motivo de
-- fn_finalizar_cotacao) — só o insert em compras_recebimentos_itens não
-- tem policy própria, por isso esta função (não o cliente) é quem grava.
create function public.fn_registrar_recebimento_item(
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

  -- pedidos_compra_itens não tem empresa_id própria (padrão mais antigo,
  -- 0017, via join) — busca no pedido pai.
  select empresa_id into v_empresa_id from public.pedidos_compra where id = v_item.pedido_id;

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
