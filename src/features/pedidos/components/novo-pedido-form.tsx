"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { Tables } from "@/lib/supabase/database.types";

import { criarPedido } from "../actions";
import { TIPOS_PEDIDO } from "../validation";
import { TIPO_PEDIDO_LABEL } from "../status";

export interface NovoPedidoFormProps {
  clientes: Pick<Tables<"clientes">, "id" | "nome">[];
  canais: Pick<Tables<"canais_venda">, "id" | "nome">[];
}

export function NovoPedidoForm({ clientes, canais }: NovoPedidoFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [tipo, setTipo] = useState<(typeof TIPOS_PEDIDO)[number]>("balcao");
  const [clienteId, setClienteId] = useState<string | null>("");
  const [canalVendaId, setCanalVendaId] = useState<string | null>("");
  const [observacoes, setObservacoes] = useState("");

  function submeter() {
    setErro(null);
    startTransition(async () => {
      try {
        const id = await criarPedido({ tipo, clienteId, canalVendaId, observacoes });
        router.push(`/pedidos/${id}`);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível criar o pedido.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo">Tipo do pedido</Label>
        <Select
          id="tipo"
          value={tipo}
          onChange={(event) => setTipo(event.target.value as (typeof TIPOS_PEDIDO)[number])}
        >
          {TIPOS_PEDIDO.map((valor) => (
            <option key={valor} value={valor}>
              {TIPO_PEDIDO_LABEL[valor]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Cliente (opcional)</Label>
          <Combobox
            options={[
              { value: "", label: "Nenhum" },
              ...clientes.map((cliente) => ({ value: cliente.id, label: cliente.nome })),
            ]}
            value={clienteId}
            onValueChange={setClienteId}
            placeholder="Selecionar cliente..."
            searchPlaceholder="Buscar cliente..."
            emptyMessage="Nenhum cliente cadastrado."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Canal (opcional)</Label>
          <Combobox
            options={[
              { value: "", label: "Nenhum" },
              ...canais.map((canal) => ({ value: canal.id, label: canal.nome })),
            ]}
            value={canalVendaId}
            onValueChange={setCanalVendaId}
            placeholder="Selecionar canal..."
            searchPlaceholder="Buscar canal..."
            emptyMessage="Nenhum canal cadastrado."
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          rows={2}
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
        />
      </div>

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      <div>
        <Button type="button" disabled={pending} onClick={submeter}>
          {pending ? "Criando..." : "Criar pedido"}
        </Button>
      </div>
    </div>
  );
}
