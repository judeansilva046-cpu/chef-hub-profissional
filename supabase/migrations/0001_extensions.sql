-- Extensões necessárias para busca (ILIKE/trigram) usada em ingredientes e fichas técnicas.
create extension if not exists pg_trgm;

-- Função utilitária compartilhada: mantém updated_at em dia em qualquer tabela que a use.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
