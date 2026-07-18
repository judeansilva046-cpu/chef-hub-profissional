create table public.fichas_tecnicas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  modo_preparo text,
  tempo_preparo_minutos integer check (tempo_preparo_minutos is null or tempo_preparo_minutos >= 0),
  rendimento_quantidade numeric(12, 4) not null check (rendimento_quantidade > 0),
  rendimento_unidade_id uuid not null references public.unidades_medida (id) on delete restrict,

  -- Entrada do usuário. preco_venda_praticado é o que ele realmente cobra
  -- hoje; margem_contribuicao_percentual_alvo sobrescreve o padrão da
  -- empresa só para esta ficha. Ambos opcionais.
  preco_venda_praticado numeric(12, 2) check (preco_venda_praticado is null or preco_venda_praticado >= 0),
  margem_contribuicao_percentual_alvo numeric(5, 2) check (
    margem_contribuicao_percentual_alvo is null
    or (margem_contribuicao_percentual_alvo >= 0 and margem_contribuicao_percentual_alvo < 100)
  ),

  -- Campos derivados: nunca escritos diretamente pelo cliente. Recalculados
  -- por trigger (ver 0009 e 0010) sempre que os itens ou os campos de entrada
  -- acima mudam — o banco é a fonte de verdade, independente do caminho de
  -- escrita (ver docs/DATABASE.md).
  peso_bruto_total numeric(12, 4) not null default 0,
  peso_liquido_total numeric(12, 4) not null default 0,
  custo_total numeric(14, 4) not null default 0,
  custo_por_porcao numeric(14, 4) not null default 0,
  preco_sugerido numeric(14, 4),
  markup_percentual numeric(9, 2),
  margem_contribuicao_percentual numeric(6, 2),
  -- cmv_percentual = food_cost_percentual: a mesma métrica (custo do
  -- ingrediente ÷ preço de venda) exposta sob os dois rótulos na UI. Não
  -- confundir com CMV contábil período-a-período (estoque inicial + compras
  -- − estoque final), que só fará sentido quando existir Controle de Estoque.
  cmv_percentual numeric(6, 2),

  versao_atual integer not null default 1,
  ativo boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fichas_tecnicas_empresa_ativo_idx on public.fichas_tecnicas (empresa_id, ativo);
create index fichas_tecnicas_nome_trgm_idx on public.fichas_tecnicas using gin (nome gin_trgm_ops);

alter table public.fichas_tecnicas enable row level security;

-- Sem policy de DELETE nesta versão (não foi pedido excluir ficha, só
-- ativo/inativo) — remover = ativo=false.
create policy "fichas_tecnicas_select_own" on public.fichas_tecnicas
  for select using (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create policy "fichas_tecnicas_insert_own" on public.fichas_tecnicas
  for insert with check (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

create policy "fichas_tecnicas_update_own" on public.fichas_tecnicas
  for update using (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  )
  with check (
    empresa_id in (select id from public.empresas where usuario_id = auth.uid())
  );

-- Fórmulas (ver docs/DATABASE.md para a versão comentada):
--   custo_por_porcao   = custo_total / rendimento_quantidade
--   margem_alvo_efetiva = COALESCE(ficha.margem_alvo, empresa.margem_padrao, 70)
--   preco_sugerido       = custo_por_porcao / (1 − margem_alvo_efetiva / 100)
--   preco_referencia      = COALESCE(preco_venda_praticado, preco_sugerido)
--   cmv_percentual (=food cost%) = (custo_por_porcao / preco_referencia) × 100
--   margem_contribuicao_percentual = 100 − cmv_percentual
--   markup_percentual                = ((preco_referencia / custo_por_porcao) − 1) × 100
--
-- Não é SECURITY DEFINER: só lê a própria empresa do usuário (já permitido
-- pela RLS de "empresas") e só escreve em NEW, dentro do UPDATE/INSERT que o
-- próprio usuário já está autorizado a fazer via a policy acima.
create function public.calcular_campos_derivados_ficha_tecnica()
returns trigger
language plpgsql
as $$
declare
  v_margem_padrao_empresa numeric(5, 2);
  v_margem_alvo_efetiva numeric(5, 2);
  v_preco_referencia numeric(14, 4);
begin
  select margem_contribuicao_padrao into v_margem_padrao_empresa
  from public.empresas where id = new.empresa_id;

  v_margem_alvo_efetiva := coalesce(new.margem_contribuicao_percentual_alvo, v_margem_padrao_empresa, 70);

  new.custo_por_porcao := case
    when new.rendimento_quantidade > 0 then new.custo_total / new.rendimento_quantidade
    else 0
  end;

  new.preco_sugerido := case
    when v_margem_alvo_efetiva < 100 then new.custo_por_porcao / (1 - v_margem_alvo_efetiva / 100)
    else null
  end;

  v_preco_referencia := coalesce(new.preco_venda_praticado, new.preco_sugerido);

  if v_preco_referencia is not null and v_preco_referencia > 0 then
    new.cmv_percentual := (new.custo_por_porcao / v_preco_referencia) * 100;
    new.margem_contribuicao_percentual := 100 - new.cmv_percentual;
  else
    new.cmv_percentual := null;
    new.margem_contribuicao_percentual := null;
  end if;

  if new.custo_por_porcao > 0 and v_preco_referencia is not null then
    new.markup_percentual := ((v_preco_referencia / new.custo_por_porcao) - 1) * 100;
  else
    new.markup_percentual := null;
  end if;

  new.updated_at := now();

  return new;
end;
$$;

create trigger fichas_tecnicas_before_upsert_calcular
  before insert or update on public.fichas_tecnicas
  for each row execute function public.calcular_campos_derivados_ficha_tecnica();
