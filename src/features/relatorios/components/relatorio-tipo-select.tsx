"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

import { RELATORIO_TIPOS } from "../tipos";

export function RelatorioTipoSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(valor: string) {
    const params = new URLSearchParams(searchParams);
    params.set("tipo", valor);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select
      aria-label="Tipo de relatório"
      className="w-52"
      defaultValue={searchParams.get("tipo") ?? "vendas"}
      onChange={(event) => atualizar(event.target.value)}
    >
      {RELATORIO_TIPOS.map((tipo) => (
        <option key={tipo.value} value={tipo.value}>
          {tipo.label}
        </option>
      ))}
    </Select>
  );
}
