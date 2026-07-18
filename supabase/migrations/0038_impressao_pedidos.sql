-- Sprint 05 (checkpoint 2): enfileira comprovantes na fila_impressao (0028,
-- estendida em 0030) exatamente nos pontos de transição de status que já
-- existem — nenhum caminho de escrita novo no app, só triggers observando
-- as mesmas tabelas. Reimpressão (feature de impressão, camada de
-- aplicação) é sempre "inserir um novo job com o mesmo payload", não um
-- conceito novo de schema.

create function public.pedidos_enfileirar_comprovante_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'confirmado' and old.status <> 'confirmado' then
    insert into public.fila_impressao (empresa_id, tipo, payload, referencia_tipo, referencia_id, criado_por)
    values (
      new.empresa_id,
      'comprovante_pedido',
      jsonb_build_object(
        'pedido_id', new.id,
        'numero', new.numero,
        'tipo', new.tipo,
        'total', new.total
      ),
      'pedido',
      new.id,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger pedidos_after_update_comprovante_pedido
  after update on public.pedidos
  for each row execute function public.pedidos_enfileirar_comprovante_pedido();

-- Um job por praça com itens no pedido — "impressão por praça/cozinha":
-- cada posto (chapa, fritura, bebidas...) só recebe o comprovante com os
-- itens que lhe dizem respeito.
create function public.pedidos_enfileirar_comprovante_praca()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_praca record;
begin
  if new.status = 'em_preparo' and old.status <> 'em_preparo' then
    for v_praca in
      select
        pp.id as praca_id,
        pp.nome as praca_nome,
        jsonb_agg(jsonb_build_object('nome', ft.nome, 'quantidade', pi.quantidade, 'observacao', pi.observacao)) as itens
      from public.pedido_itens pi
      join public.fichas_tecnicas ft on ft.id = pi.ficha_tecnica_id
      join public.pracas_producao pp on pp.id = ft.praca_producao_id
      where pi.pedido_id = new.id
      group by pp.id, pp.nome
    loop
      insert into public.fila_impressao (empresa_id, tipo, payload, referencia_tipo, referencia_id, criado_por)
      values (
        new.empresa_id,
        'comprovante_praca',
        jsonb_build_object(
          'pedido_id', new.id,
          'numero', new.numero,
          'praca_id', v_praca.praca_id,
          'praca_nome', v_praca.praca_nome,
          'itens', v_praca.itens
        ),
        'pedido',
        new.id,
        auth.uid()
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger pedidos_after_update_comprovante_praca
  after update on public.pedidos
  for each row execute function public.pedidos_enfileirar_comprovante_praca();

-- Estende a trigger de criação de expedição (0036) para também enfileirar o
-- comprovante de expedição — CREATE OR REPLACE preserva o comportamento
-- original (criar a linha em expedicoes), só adiciona o enfileiramento.
create or replace function public.pedidos_criar_expedicao()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'pronto' and old.status <> 'pronto' and new.tipo in ('entrega', 'retirada') then
    insert into public.expedicoes (empresa_id, pedido_id, responsavel_id)
    values (new.empresa_id, new.id, auth.uid())
    on conflict (pedido_id) do nothing;

    insert into public.fila_impressao (empresa_id, tipo, payload, referencia_tipo, referencia_id, criado_por)
    values (
      new.empresa_id,
      'comprovante_expedicao',
      jsonb_build_object('pedido_id', new.id, 'numero', new.numero, 'tipo', new.tipo),
      'pedido',
      new.id,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create function public.caixas_enfileirar_fechamento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'fechado' and old.status <> 'fechado' then
    insert into public.fila_impressao (empresa_id, tipo, payload, referencia_tipo, referencia_id, criado_por)
    values (
      new.empresa_id,
      'fechamento_caixa',
      jsonb_build_object(
        'caixa_id', new.id,
        'saldo_inicial', new.saldo_inicial,
        'saldo_esperado', new.saldo_esperado,
        'saldo_informado', new.saldo_informado,
        'diferenca', new.diferenca
      ),
      'caixa',
      new.id,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger caixas_after_update_comprovante_fechamento
  after update on public.caixas
  for each row execute function public.caixas_enfileirar_fechamento();
