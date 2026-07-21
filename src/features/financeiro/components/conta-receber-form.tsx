"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import { criarContaReceber } from "../erp/actions";

export function ContaReceberForm() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="grid max-w-xl gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErro(null);
        setOk(false);
        startTransition(async () => {
          try {
            await criarContaReceber({
              description: String(fd.get("description") ?? ""),
              amount: fd.get("amount"),
              competenceDate: String(fd.get("competenceDate") ?? ""),
              dueDate: String(fd.get("dueDate") ?? ""),
              source: String(fd.get("source") ?? "outro"),
              installmentTotal: fd.get("installmentTotal") || 1,
              autoSettle: fd.get("autoSettle") === "on",
            });
            setOk(true);
            e.currentTarget.reset();
          } catch (err) {
            setErro(err instanceof Error ? err.message : "Erro ao salvar.");
          }
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="source">Origem</Label>
          <select
            id="source"
            name="source"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            defaultValue="pix"
          >
            <option value="delivery">Delivery</option>
            <option value="mesa">Mesas</option>
            <option value="pix">PIX</option>
            <option value="cartao">Cartão</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="marketplace">Marketplace</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="competenceDate">Competência</Label>
          <Input id="competenceDate" name="competenceDate" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Vencimento</Label>
          <Input id="dueDate" name="dueDate" type="date" required />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="installmentTotal">Parcelas</Label>
          <Input
            id="installmentTotal"
            name="installmentTotal"
            type="number"
            min={1}
            defaultValue={1}
          />
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input type="checkbox" name="autoSettle" />
          Baixa automática
        </label>
      </div>
      {erro ? (
        <Text tone="danger" size="sm">
          {erro}
        </Text>
      ) : null}
      {ok ? (
        <Text tone="success" size="sm">
          Conta a receber criada.
        </Text>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar conta a receber"}
      </Button>
    </form>
  );
}
