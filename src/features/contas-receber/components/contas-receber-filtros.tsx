"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ContasReceberFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor) params.set("status", valor);
    else params.delete("status");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="filtro-status">Status</Label>
      <Select
        id="filtro-status"
        className="w-56"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => atualizar(event.target.value)}
      >
        <option value="">Todos os status</option>
        <option value="pendente">Pendente</option>
        <option value="recebido_parcial">Parcialmente recebido</option>
        <option value="recebido">Recebido</option>
        <option value="cancelado">Cancelado</option>
      </Select>
    </div>
  );
}
