"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import { criarContaPagar } from "../erp/actions";

export function ContaPagarForm({
  centros,
  categorias,
}: {
  centros: Array<{ id: string; name: string }>;
  categorias: Array<{ id: string; name: string; tipo: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const despesas = categorias.filter((c) => c.tipo === "despesa" || c.tipo === "imposto");

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
            await criarContaPagar({
              description: String(fd.get("description") ?? ""),
              amount: fd.get("amount"),
              competenceDate: String(fd.get("competenceDate") ?? ""),
              dueDate: String(fd.get("dueDate") ?? ""),
              costCenterId: String(fd.get("costCenterId") || "") || null,
              categoryId: String(fd.get("categoryId") || "") || null,
              interestAmount: fd.get("interestAmount") || 0,
              fineAmount: fd.get("fineAmount") || 0,
              installmentTotal: fd.get("installmentTotal") || 1,
              attachmentUrl: String(fd.get("attachmentUrl") || "") || null,
              notes: String(fd.get("notes") || "") || null,
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
          <Label htmlFor="installmentTotal">Parcelas</Label>
          <Input
            id="installmentTotal"
            name="installmentTotal"
            type="number"
            min={1}
            defaultValue={1}
          />
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
          <Label htmlFor="interestAmount">Juros</Label>
          <Input id="interestAmount" name="interestAmount" type="number" step="0.01" defaultValue={0} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fineAmount">Multa</Label>
          <Input id="fineAmount" name="fineAmount" type="number" step="0.01" defaultValue={0} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="costCenterId">Centro de custo</Label>
          <select
            id="costCenterId"
            name="costCenterId"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoria</Label>
          <select
            id="categoryId"
            name="categoryId"
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">—</option>
            {despesas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="attachmentUrl">Anexo (URL)</Label>
        <Input id="attachmentUrl" name="attachmentUrl" placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Input id="notes" name="notes" />
      </div>
      {erro ? (
        <Text tone="danger" size="sm">
          {erro}
        </Text>
      ) : null}
      {ok ? (
        <Text tone="success" size="sm">
          Conta a pagar criada.
        </Text>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar conta a pagar"}
      </Button>
    </form>
  );
}
