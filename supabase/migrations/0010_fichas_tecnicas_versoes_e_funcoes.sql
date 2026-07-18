-- Histórico de versões: um snapshot completo (ficha + itens) por chamada de
-- salvar_ficha_tecnica bem-sucedida — versionamento automático, um "Salvar"
-- na UI = uma versão, sem exigir que o usuário clique em algo à parte.
create table public.fichas_tecnicas_versoes (
  id uuid primary key default gen_random_uuid(),
  ficha_tecnica_id uuid not null references public.fichas_tecnicas (id) on delete cascade,
  numero_versao integer not null,
  snapshot jsonb not null,
  motivo text,
  criado_por uuid references public.profiles (id),
  criado_em timestamptz not null default now(),
  unique (ficha_tecnica_id, numero_versao)
);

create index fichas_tecnicas_versoes_ficha_idx
  on public.fichas_tecnicas_versoes (ficha_tecnica_id, numero_versao desc);

alter table public.fichas_tecnicas_versoes enable row level security;

-- Só SELECT para o role authenticated, de propósito: a única forma de gravar
-- uma versão é através de salvar_ficha_tecnica (SECURITY DEFINER, abaixo).
-- Isso impede qualquer client-side escrever um "histórico" falso.
create policy "fichas_tecnicas_versoes_select_own" on public.fichas_tecnicas_versoes
  for select using (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.empresas e on e.id = ft.empresa_id
      where ft.id = fichas_tecnicas_versoes.ficha_tecnica_id
        and e.usuario_id = auth.uid()
    )
  );

-- Único caminho de escrita para fichas técnicas + seus itens: cria ou
-- atualiza a ficha, substitui inteiramente a lista de itens (mais simples e
-- confiável do que diffar uma lista dinâmica de tamanho ilimitado) e grava
-- uma nova versão — tudo em uma única transação atômica.
--
-- SECURITY DEFINER porque insere em fichas_tecnicas_versoes, que não tem
-- policy de INSERT para authenticated (ver acima). Por isso reimplementa
-- manualmente a checagem de autorização logo no início (convenção do
-- projeto para toda função SECURITY DEFINER que grava dados).
create function public.salvar_ficha_tecnica(
  p_ficha_id uuid,
  p_empresa_id uuid,
  p_nome text,
  p_modo_preparo text,
  p_tempo_preparo_minutos integer,
  p_rendimento_quantidade numeric,
  p_rendimento_unidade_id uuid,
  p_preco_venda_praticado numeric,
  p_margem_contribuicao_percentual_alvo numeric,
  p_itens jsonb,
  p_motivo_versao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ficha_id uuid;
  v_proximo_numero_versao integer;
  v_snapshot jsonb;
begin
  if not exists (
    select 1 from public.empresas where id = p_empresa_id and usuario_id = auth.uid()
  ) then
    raise exception 'Empresa não encontrada ou não pertence ao usuário atual';
  end if;

  if p_ficha_id is not null and not exists (
    select 1 from public.fichas_tecnicas where id = p_ficha_id and empresa_id = p_empresa_id
  ) then
    raise exception 'Ficha técnica não encontrada nesta empresa';
  end if;

  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'A ficha técnica precisa de ao menos um ingrediente';
  end if;

  if p_ficha_id is null then
    insert into public.fichas_tecnicas (
      empresa_id, nome, modo_preparo, tempo_preparo_minutos,
      rendimento_quantidade, rendimento_unidade_id,
      preco_venda_praticado, margem_contribuicao_percentual_alvo, created_by
    ) values (
      p_empresa_id, p_nome, p_modo_preparo, p_tempo_preparo_minutos,
      p_rendimento_quantidade, p_rendimento_unidade_id,
      p_preco_venda_praticado, p_margem_contribuicao_percentual_alvo, auth.uid()
    )
    returning id into v_ficha_id;
  else
    v_ficha_id := p_ficha_id;

    update public.fichas_tecnicas set
      nome = p_nome,
      modo_preparo = p_modo_preparo,
      tempo_preparo_minutos = p_tempo_preparo_minutos,
      rendimento_quantidade = p_rendimento_quantidade,
      rendimento_unidade_id = p_rendimento_unidade_id,
      preco_venda_praticado = p_preco_venda_praticado,
      margem_contribuicao_percentual_alvo = p_margem_contribuicao_percentual_alvo
    where id = v_ficha_id;

    delete from public.fichas_tecnicas_itens where ficha_tecnica_id = v_ficha_id;
  end if;

  insert into public.fichas_tecnicas_itens (
    ficha_tecnica_id, ingrediente_id, peso_bruto, percentual_perda, ordem
  )
  select
    v_ficha_id,
    (item ->> 'ingrediente_id')::uuid,
    (item ->> 'peso_bruto')::numeric,
    coalesce((item ->> 'percentual_perda')::numeric, 0),
    coalesce((item ->> 'ordem')::integer, 0)
  from jsonb_array_elements(p_itens) as item;

  select coalesce(max(numero_versao), 0) + 1 into v_proximo_numero_versao
  from public.fichas_tecnicas_versoes where ficha_tecnica_id = v_ficha_id;

  select to_jsonb(ft.*) || jsonb_build_object(
    'itens',
    (select jsonb_agg(to_jsonb(fti.*) order by fti.ordem)
     from public.fichas_tecnicas_itens fti
     where fti.ficha_tecnica_id = v_ficha_id)
  )
  into v_snapshot
  from public.fichas_tecnicas ft
  where ft.id = v_ficha_id;

  insert into public.fichas_tecnicas_versoes (ficha_tecnica_id, numero_versao, snapshot, motivo, criado_por)
  values (v_ficha_id, v_proximo_numero_versao, v_snapshot, p_motivo_versao, auth.uid());

  update public.fichas_tecnicas set versao_atual = v_proximo_numero_versao where id = v_ficha_id;

  return v_ficha_id;
end;
$$;

grant execute on function public.salvar_ficha_tecnica(
  uuid, uuid, text, text, integer, numeric, uuid, numeric, numeric, jsonb, text
) to authenticated;

-- "Duplicar ficha": lê a ficha de origem (a leitura já é protegida pela RLS
-- normal de fichas_tecnicas — daí ser SECURITY INVOKER, não precisa
-- bypassar nada) e reusa salvar_ficha_tecnica para criar a cópia, garantindo
-- que a ficha duplicada passe pelo mesmíssimo caminho validado, versionado e
-- recalculado que qualquer outra ficha nova.
create function public.fn_duplicar_ficha_tecnica(p_ficha_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ficha record;
  v_itens jsonb;
begin
  select * into v_ficha from public.fichas_tecnicas where id = p_ficha_id;

  if not found then
    raise exception 'Ficha técnica não encontrada';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'ingrediente_id', ingrediente_id,
        'peso_bruto', peso_bruto,
        'percentual_perda', percentual_perda,
        'ordem', ordem
      )
      order by ordem
    ),
    '[]'::jsonb
  )
  into v_itens
  from public.fichas_tecnicas_itens
  where ficha_tecnica_id = p_ficha_id;

  return public.salvar_ficha_tecnica(
    null,
    v_ficha.empresa_id,
    v_ficha.nome || ' (cópia)',
    v_ficha.modo_preparo,
    v_ficha.tempo_preparo_minutos,
    v_ficha.rendimento_quantidade,
    v_ficha.rendimento_unidade_id,
    v_ficha.preco_venda_praticado,
    v_ficha.margem_contribuicao_percentual_alvo,
    v_itens,
    'Duplicado da ficha "' || v_ficha.nome || '"'
  );
end;
$$;

grant execute on function public.fn_duplicar_ficha_tecnica(uuid) to authenticated;
