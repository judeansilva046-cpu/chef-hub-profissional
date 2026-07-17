"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/database.types";

export interface IngredientesFiltrosProps {
  categorias: Tables<"categorias_ingredientes">[];
}

export function IngredientesFiltros({ categorias }: IngredientesFiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizarParam(nome: string, valor: string) {
    const params = new URLSearchParams(searchParams);

    if (valor) {
      params.set(nome, valor);
    } else {
      params.delete(nome);
    }
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex gap-3">
      <Select
        aria-label="Filtrar por categoria"
        className="w-48"
        defaultValue={searchParams.get("categoria") ?? ""}
        onChange={(event) => atualizarParam("categoria", event.target.value)}
      >
        <option value="">Todas as categorias</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.nome}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filtrar por status"
        className="w-40"
        defaultValue={searchParams.get("ativo") ?? "true"}
        onChange={(event) => atualizarParam("ativo", event.target.value)}
      >
        <option value="true">Ativos</option>
        <option value="false">Inativos</option>
        <option value="todos">Todos</option>
      </Select>
    </div>
  );
}
