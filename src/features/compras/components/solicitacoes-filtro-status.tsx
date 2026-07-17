"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

export function SolicitacoesFiltroStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor && valor !== "todos") {
      params.set("status", valor);
    } else {
      params.delete("status");
    }
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select
      aria-label="Filtrar por status"
      className="w-48"
      defaultValue={searchParams.get("status") ?? "todos"}
      onChange={(event) => atualizar(event.target.value)}
    >
      <option value="todos">Todos os status</option>
      <option value="pendente">Pendente</option>
      <option value="aprovada">Aprovada</option>
      <option value="rejeitada">Rejeitada</option>
      <option value="convertida">Convertida em pedido</option>
    </Select>
  );
}
