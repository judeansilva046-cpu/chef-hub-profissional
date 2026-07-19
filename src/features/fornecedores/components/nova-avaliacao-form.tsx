"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";

import { criarAvaliacaoFornecedor } from "../actions";

const NOTAS = [1, 2, 3, 4, 5];

export function NovaAvaliacaoForm({ fornecedorId, pedidoId }: { fornecedorId: string; pedidoId?: string }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  if (!mostrarFormulario) {
    return (
      <Button variant="outline" size="sm" onClick={() => setMostrarFormulario(true)}>
        Avaliar fornecedor
      </Button>
    );
  }

  return (
    <AvaliacaoFornecedorFormulario
      fornecedorId={fornecedorId}
      pedidoId={pedidoId}
      onSaved={() => setMostrarFormulario(false)}
      onCancel={() => setMostrarFormulario(false)}
    />
  );
}

function AvaliacaoFornecedorFormulario({
  fornecedorId,
  pedidoId,
  onSaved,
  onCancel,
}: {
  fornecedorId: string;
  pedidoId?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(criarAvaliacaoFornecedor, undefined);

  useEffect(() => {
    if (state?.success) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="border-border flex flex-col gap-3 rounded-lg border p-3">
      <input type="hidden" name="fornecedorId" value={fornecedorId} />
      {pedidoId && <input type="hidden" name="pedidoId" value={pedidoId} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs" htmlFor="pontualidade">
            Pontualidade
          </label>
          <Select id="pontualidade" name="pontualidade" defaultValue="5">
            {NOTAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs" htmlFor="qualidade">
            Qualidade
          </label>
          <Select id="qualidade" name="qualidade" defaultValue="5">
            {NOTAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs" htmlFor="preco">
            Preço
          </label>
          <Select id="preco" name="preco" defaultValue="5">
            {NOTAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs" htmlFor="atendimento">
            Atendimento
          </label>
          <Select id="atendimento" name="atendimento" defaultValue="5">
            {NOTAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Textarea name="comentario" rows={2} placeholder="Comentário (opcional)" />

      {state?.formError && (
        <Text size="sm" tone="danger">
          {state.formError}
        </Text>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando..." : "Salvar avaliação"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
