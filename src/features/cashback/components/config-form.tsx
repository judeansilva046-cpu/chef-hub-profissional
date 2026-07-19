"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarConfigCashback } from "../actions";

export function ConfigCashbackForm({ config }: { config: Tables<"crm_cashback_config"> | null }) {
  const [state, formAction, pending] = useActionState(salvarConfigCashback, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de cashback</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativo" defaultChecked={config?.ativo ?? false} />
            Cashback ativo
          </label>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" name="tipo" defaultValue={config?.tipo ?? "percentual"}>
                <option value="percentual">Percentual</option>
                <option value="fixo">Valor fixo</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="percentual">Percentual (%)</Label>
              <Input id="percentual" name="percentual" type="number" step="0.01" min="0" max="100" defaultValue={config?.percentual ?? 0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorFixo">Valor fixo (R$)</Label>
              <Input id="valorFixo" name="valorFixo" type="number" step="0.01" min="0" defaultValue={config?.valor_fixo ?? 0} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="limitePorVenda">Limite por venda (0 = sem limite)</Label>
              <Input id="limitePorVenda" name="limitePorVenda" type="number" step="0.01" min="0" defaultValue={config?.limite_por_venda ?? 0} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:w-64">
            <Label htmlFor="validadeDias">Validade (dias, opcional)</Label>
            <Input id="validadeDias" name="validadeDias" type="number" step="1" min="1" defaultValue={config?.validade_dias ?? ""} placeholder="Nunca expira" />
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
