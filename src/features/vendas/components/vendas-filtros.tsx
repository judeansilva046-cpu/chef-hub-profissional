"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/database.types";

export interface VendasFiltrosProps {
  canais: Tables<"canais_venda">[];
}

export function VendasFiltros({ canais }: VendasFiltrosProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor) {
      params.set(chave, valor);
    } else {
      params.delete(chave);
    }
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-data-inicio">De</Label>
        <Input
          id="filtro-data-inicio"
          type="date"
          className="w-40"
          defaultValue={searchParams.get("dataInicio") ?? ""}
          onChange={(event) => atualizar("dataInicio", event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-data-fim">Até</Label>
        <Input
          id="filtro-data-fim"
          type="date"
          className="w-40"
          defaultValue={searchParams.get("dataFim") ?? ""}
          onChange={(event) => atualizar("dataFim", event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-canal">Canal</Label>
        <Select
          id="filtro-canal"
          className="w-48"
          defaultValue={searchParams.get("canalVendaId") ?? ""}
          onChange={(event) => atualizar("canalVendaId", event.target.value)}
        >
          <option value="">Todos os canais</option>
          {canais.map((canal) => (
            <option key={canal.id} value={canal.id}>
              {canal.nome}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
