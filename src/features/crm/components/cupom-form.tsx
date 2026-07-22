"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";

import { criarCupom } from "../actions";

export function CupomForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      try {
        await criarCupom({
          code: formData.get("code"),
          name: formData.get("name"),
          tipo: formData.get("tipo"),
          discountPercent: formData.get("discountPercent") || null,
          discountAmount: formData.get("discountAmount") || null,
          giftDescription: formData.get("giftDescription") || null,
          minOrderAmount: formData.get("minOrderAmount") || 0,
          maxUses: formData.get("maxUses") || null,
          maxUsesPerCustomer: formData.get("maxUsesPerCustomer") || 1,
          endsAt: formData.get("endsAt") || null,
        });
        setMsg("Cupom criado.");
        router.refresh();
      } catch (error) {
        setMsg(error instanceof Error ? error.message : "Falha ao criar cupom.");
      }
    });
  }

  return (
    <form action={onSubmit} className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <Text weight="semibold">Novo cupom</Text>
      <input name="code" placeholder="Código" required className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="name" placeholder="Nome" required className="border-border rounded-md border px-3 py-2 text-sm" />
      <Select name="tipo" defaultValue="percentual">
        <option value="percentual">Percentual</option>
        <option value="valor_fixo">Valor fixo</option>
        <option value="frete_gratis">Frete grátis</option>
        <option value="brinde">Brinde</option>
        <option value="combo">Combo</option>
        <option value="primeira_compra">Primeira compra</option>
        <option value="aniversario">Aniversário</option>
        <option value="inatividade">Inatividade</option>
      </Select>
      <input name="discountPercent" type="number" step="0.01" placeholder="% desconto" className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="discountAmount" type="number" step="0.01" placeholder="Valor fixo / frete" className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="giftDescription" placeholder="Brinde" className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="minOrderAmount" type="number" step="0.01" placeholder="Pedido mínimo" defaultValue="0" className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="maxUses" type="number" placeholder="Limite global" className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="maxUsesPerCustomer" type="number" placeholder="Limite por cliente" defaultValue="1" className="border-border rounded-md border px-3 py-2 text-sm" />
      <input name="endsAt" type="datetime-local" className="border-border rounded-md border px-3 py-2 text-sm" />
      {msg && <Text size="sm" tone="muted">{msg}</Text>}
      <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Criar cupom"}</Button>
    </form>
  );
}
