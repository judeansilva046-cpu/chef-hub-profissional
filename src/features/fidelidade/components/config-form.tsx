"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarConfigFidelidade } from "../actions";

export function ConfigFidelidadeForm({ config }: { config: Tables<"crm_fidelidade_config"> | null }) {
  const [state, formAction, pending] = useActionState(salvarConfigFidelidade, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de pontos</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativo" defaultChecked={config?.ativo ?? false} />
            Programa de fidelidade ativo
          </label>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pontosPorValor">Pontos por R$1,00</Label>
              <Input
                id="pontosPorValor"
                name="pontosPorValor"
                type="number"
                step="0.01"
                min="0"
                defaultValue={config?.pontos_por_valor ?? 1}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorPontoResgate">Valor de cada ponto (R$)</Label>
              <Input
                id="valorPontoResgate"
                name="valorPontoResgate"
                type="number"
                step="0.0001"
                min="0"
                defaultValue={config?.valor_ponto_resgate ?? 0.01}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="validadeDias">Validade (dias, opcional)</Label>
              <Input
                id="validadeDias"
                name="validadeDias"
                type="number"
                step="1"
                min="1"
                defaultValue={config?.validade_dias ?? ""}
                placeholder="Nunca expira"
              />
            </div>
          </div>

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}
          {state?.success && (
            <Text size="sm" tone="success">
              Configuração salva.
            </Text>
          )}

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
