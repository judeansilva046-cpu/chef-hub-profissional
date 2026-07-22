"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";

import { registrarPerdaEstoque } from "../actions";

export function PerdaForm({
  ingredientes,
}: {
  ingredientes: Array<{ id: string; nome: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onSubmit(formData: FormData) {
    setErro(null);
    setOk(false);
    startTransition(async () => {
      try {
        await registrarPerdaEstoque({
          ingredienteId: String(formData.get("ingredienteId") ?? ""),
          quantity: formData.get("quantity"),
          reason: String(formData.get("reason") ?? ""),
          notes: String(formData.get("notes") ?? "") || null,
          lostAt: String(formData.get("lostAt") ?? "") || null,
        });
        setOk(true);
        router.refresh();
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Falha ao registrar perda.");
      }
    });
  }

  return (
    <form action={onSubmit} className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4">
      <Text weight="semibold">Registrar perda</Text>
      <label className="flex flex-col gap-1 text-sm">
        Ingrediente
        <Select name="ingredienteId" required defaultValue="">
          <option value="" disabled>
            Selecione...
          </option>
          {ingredientes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Quantidade
        <input
          name="quantity"
          type="number"
          step="0.001"
          min="0.001"
          required
          className="border-border bg-background rounded-md border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Motivo
        <Select name="reason" defaultValue="desperdicio">
          <option value="quebra">Quebra</option>
          <option value="vencimento">Vencimento</option>
          <option value="desperdicio">Desperdício</option>
          <option value="producao">Produção</option>
          <option value="outro">Outro</option>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Data
        <input
          name="lostAt"
          type="date"
          className="border-border bg-background rounded-md border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Observação
        <input
          name="notes"
          className="border-border bg-background rounded-md border px-3 py-2"
        />
      </label>
      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}
      {ok && (
        <Text size="sm" tone="success">
          Perda registrada e estoque baixado.
        </Text>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Registrar perda"}
      </Button>
    </form>
  );
}
