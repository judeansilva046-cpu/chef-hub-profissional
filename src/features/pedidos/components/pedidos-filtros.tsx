"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

import { STATUS_PEDIDO_LABEL, TIPO_PEDIDO_LABEL } from "../status";

export function PedidosFiltros() {
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
        <Label htmlFor="filtro-busca">Número do pedido</Label>
        <SearchInput paramName="busca" className="w-48" placeholder="Ex: 42" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-status">Status</Label>
        <Select
          id="filtro-status"
          className="w-48"
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(event) => atualizar("status", event.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_PEDIDO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filtro-tipo">Tipo</Label>
        <Select
          id="filtro-tipo"
          className="w-44"
          defaultValue={searchParams.get("tipo") ?? ""}
          onChange={(event) => atualizar("tipo", event.target.value)}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_PEDIDO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
