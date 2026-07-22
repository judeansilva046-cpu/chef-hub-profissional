"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { Tables } from "@/lib/supabase/database.types";

import { salvarProgramaFidelidade } from "../actions";

export function FidelidadeForm({
  programa,
}: {
  programa: Tables<"loyalty_programs"> | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      try {
        await salvarProgramaFidelidade({
          name: formData.get("name"),
          pointsPerCurrency: formData.get("pointsPerCurrency"),
          currencyPerPoint: formData.get("currencyPerPoint"),
          cashbackPercent: formData.get("cashbackPercent"),
          pointsValidityDays: formData.get("pointsValidityDays"),
          minRedeemPoints: formData.get("minRedeemPoints"),
          welcomePoints: formData.get("welcomePoints"),
          active: formData.get("active") === "on",
        });
        setMsg("Programa salvo.");
        router.refresh();
      } catch (error) {
        setMsg(error instanceof Error ? error.message : "Falha ao salvar.");
      }
    });
  }

  return (
    <form action={onSubmit} className="border-border bg-card flex max-w-xl flex-col gap-3 rounded-lg border p-4">
      <Text weight="semibold">Regras de fidelidade</Text>
      <Field name="name" label="Nome" defaultValue={programa?.name ?? "Fidelidade ChefHub"} />
      <Field
        name="pointsPerCurrency"
        label="Pontos por R$ 1"
        type="number"
        step="0.01"
        defaultValue={String(programa?.points_per_currency ?? 1)}
      />
      <Field
        name="currencyPerPoint"
        label="R$ por ponto (resgate)"
        type="number"
        step="0.01"
        defaultValue={String(programa?.currency_per_point ?? 0.05)}
      />
      <Field
        name="cashbackPercent"
        label="Cashback %"
        type="number"
        step="0.01"
        defaultValue={String(programa?.cashback_percent ?? 0)}
      />
      <Field
        name="pointsValidityDays"
        label="Validade dos pontos (dias)"
        type="number"
        defaultValue={String(programa?.points_validity_days ?? 365)}
      />
      <Field
        name="minRedeemPoints"
        label="Mínimo para resgate"
        type="number"
        defaultValue={String(programa?.min_redeem_points ?? 100)}
      />
      <Field
        name="welcomePoints"
        label="Pontos de boas-vindas"
        type="number"
        defaultValue={String(programa?.welcome_points ?? 0)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input name="active" type="checkbox" defaultChecked={programa?.active ?? true} />
        Programa ativo
      </label>
      {msg && (
        <Text size="sm" tone="muted">
          {msg}
        </Text>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar regras"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required
        className="border-border bg-background rounded-md border px-3 py-2"
      />
    </label>
  );
}
