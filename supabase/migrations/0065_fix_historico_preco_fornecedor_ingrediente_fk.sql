-- Sprint 08 (fix pós-teste E2E): fn_registrar_historico_preco_fornecedor_
-- ingrediente (0055) rodava como um único trigger BEFORE que também tentava
-- inserir em fornecedor_ingredientes_historico_precos referenciando new.id
-- — mas em um trigger BEFORE a linha em fornecedor_ingredientes ainda não
-- foi gravada, então o FK fornecedor_ingrediente_id sempre falhava
-- (violates foreign key constraint) em todo INSERT/UPDATE de preço,
-- confirmado no teste E2E do fluxo de compras. Divide em dois triggers:
-- BEFORE só define new.preco_anterior (precisa rodar antes da gravação);
-- AFTER grava o histórico (a linha já existe e satisfaz o FK).
drop trigger fornecedor_ingredientes_before_upsert_historico on public.fornecedor_ingredientes;

create or replace function public.fn_definir_preco_anterior_fornecedor_ingrediente()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and old.preco_unitario is distinct from new.preco_unitario then
    new.preco_anterior := old.preco_unitario;
  end if;
  return new;
end;
$$;

create trigger fornecedor_ingredientes_before_upsert_preco_anterior
  before update of preco_unitario on public.fornecedor_ingredientes
  for each row execute function public.fn_definir_preco_anterior_fornecedor_ingrediente();

create or replace function public.fn_registrar_historico_preco_fornecedor_ingrediente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' or old.preco_unitario is distinct from new.preco_unitario then
    insert into public.fornecedor_ingredientes_historico_precos (
      empresa_id, fornecedor_ingrediente_id, preco_unitario, criado_por
    ) values (
      new.empresa_id, new.id, new.preco_unitario, auth.uid()
    );
  end if;

  return new;
end;
$$;

revoke execute on function public.fn_registrar_historico_preco_fornecedor_ingrediente() from public, anon, authenticated;

create trigger fornecedor_ingredientes_after_upsert_historico
  after insert or update of preco_unitario on public.fornecedor_ingredientes
  for each row execute function public.fn_registrar_historico_preco_fornecedor_ingrediente();
