"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";

import { criarEmpresa } from "../actions";
import { TIPOS_NEGOCIO } from "../types";

export function CriarEmpresaForm() {
  const [state, formAction, pending] = useActionState(criarEmpresa, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome da empresa</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex: Cantina da Maria"
          required
        />
        {state?.fieldErrors?.nome && (
          <Text size="sm" tone="danger">
            {state.fieldErrors.nome[0]}
          </Text>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipoNegocio">Tipo de negócio</Label>
        <Select
          id="tipoNegocio"
          name="tipoNegocio"
          defaultValue="restaurante"
          required
        >
          {TIPOS_NEGOCIO.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </Select>
        {state?.fieldErrors?.tipoNegocio && (
          <Text size="sm" tone="danger">
            {state.fieldErrors.tipoNegocio[0]}
          </Text>
        )}
      </div>

      {state?.formError && (
        <Text size="sm" tone="danger">
          {state.formError}
        </Text>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Criando..." : "Criar empresa"}
      </Button>
    </form>
  );
}
