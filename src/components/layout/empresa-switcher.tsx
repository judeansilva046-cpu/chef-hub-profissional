"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Select } from "@/components/ui/select";
import { selecionarEmpresa } from "@/features/empresa/actions";
import type { Tables } from "@/lib/supabase/database.types";

const NOVA_EMPRESA_VALUE = "__nova_empresa__";

export interface EmpresaSwitcherProps {
  empresas: Tables<"empresas">[];
  empresaAtualId: string;
}

export function EmpresaSwitcher({
  empresas,
  empresaAtualId,
}: EmpresaSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      aria-label="Empresa ativa"
      value={empresaAtualId}
      disabled={pending}
      className="h-9 max-w-48"
      onChange={(event) => {
        const value = event.target.value;

        if (value === NOVA_EMPRESA_VALUE) {
          router.push("/onboarding");
          return;
        }

        startTransition(() => {
          void selecionarEmpresa(value);
        });
      }}
    >
      {empresas.map((empresa) => (
        <option key={empresa.id} value={empresa.id}>
          {empresa.nome}
        </option>
      ))}
      <option value={NOVA_EMPRESA_VALUE}>+ Nova empresa</option>
    </Select>
  );
}
