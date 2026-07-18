"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

export function MovimentacoesFiltroTipo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor && valor !== "todos") {
      params.set("tipo", valor);
    } else {
      params.delete("tipo");
    }
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select
      aria-label="Filtrar por tipo"
      className="w-48"
      defaultValue={searchParams.get("tipo") ?? "todos"}
      onChange={(event) => atualizar(event.target.value)}
    >
      <option value="todos">Todos os tipos</option>
      <option value="entrada">Entrada</option>
      <option value="saida">Saída</option>
      <option value="ajuste_entrada">Ajuste (+)</option>
      <option value="ajuste_saida">Ajuste (-)</option>
      <option value="inventario">Inventário</option>
    </Select>
  );
}
