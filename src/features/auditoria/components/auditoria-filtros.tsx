"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function AuditoriaFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor) params.set("tabela", valor);
    else params.delete("tabela");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="filtro-tabela">Tabela</Label>
      <Select
        id="filtro-tabela"
        className="w-56"
        defaultValue={searchParams.get("tabela") ?? ""}
        onChange={(event) => atualizar(event.target.value)}
      >
        <option value="">Todas as tabelas</option>
        <option value="contas_pagar">Contas a pagar</option>
        <option value="contas_receber">Contas a receber</option>
        <option value="contas_receber_parcelas">Parcelas</option>
        <option value="plano_contas">Plano de contas</option>
        <option value="centros_custo">Centros de custo</option>
      </Select>
    </div>
  );
}
