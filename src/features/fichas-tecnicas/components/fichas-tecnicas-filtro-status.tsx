"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

export function FichasTecnicasFiltroStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      aria-label="Filtrar por status"
      className="w-40"
      defaultValue={searchParams.get("ativo") ?? "true"}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams);
        params.set("ativo", event.target.value);
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`);
      }}
    >
      <option value="true">Ativas</option>
      <option value="false">Inativas</option>
      <option value="todos">Todas</option>
    </Select>
  );
}
