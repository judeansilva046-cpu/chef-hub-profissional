"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";
import type { Tables } from "@/lib/supabase/database.types";

import { criarPedidoCompra } from "../actions";
import { criarItemPedidoVazio, type PedidoItemFormState } from "../types";
import { PedidoItemRow } from "./pedido-item-row";

export interface PedidoFormProps {
  ingredientes: IngredienteParaSelecao[];
  fornecedores: Tables<"fornecedores">[];
}

export function PedidoForm({ ingredientes, fornecedores }: PedidoFormProps) {
  const router = useRouter();
  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState("");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<PedidoItemFormState[]>([
    criarItemPedidoVazio(),
  ]);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function atualizarItem(uid: string, novoItem: PedidoItemFormState) {
    setItens((atual) =>
      atual.map((item) => (item.uid === uid ? novoItem : item)),
    );
  }

  function removerItem(uid: string) {
    setItens((atual) => atual.filter((item) => item.uid !== uid));
  }

  function adicionarItem() {
    setItens((atual) => [...atual, criarItemPedidoVazio()]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    startTransition(async () => {
      try {
        const id = await criarPedidoCompra({
          fornecedorId,
          dataPrevistaEntrega: dataPrevistaEntrega || null,
          observacao,
          itens,
        });
        router.push(`/compras/pedidos/${id}`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível criar o pedido.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fornecedorId">Fornecedor</Label>
              <Select
                id="fornecedorId"
                value={fornecedorId}
                onChange={(event) => setFornecedorId(event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecionar...
                </option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataPrevistaEntrega">
                Previsão de entrega (opcional)
              </Label>
              <Input
                id="dataPrevistaEntrega"
                type="date"
                value={dataPrevistaEntrega}
                onChange={(event) => setDataPrevistaEntrega(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              rows={2}
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens do pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground grid grid-cols-12 gap-3 pb-2 text-xs font-medium tracking-wide uppercase">
            <span className="col-span-5">Ingrediente</span>
            <span className="col-span-2">Quantidade</span>
            <span className="col-span-2">Preço unitário</span>
            <span className="col-span-2">Total</span>
            <span className="col-span-1" />
          </div>

          {itens.map((item) => (
            <PedidoItemRow
              key={item.uid}
              item={item}
              ingredientes={ingredientes}
              onChange={(novoItem) => atualizarItem(item.uid, novoItem)}
              onRemove={() => removerItem(item.uid)}
              podeRemover={itens.length > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={adicionarItem}
          >
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        </CardContent>
      </Card>

      {erro && (
        <Text tone="danger" size="sm">
          {erro}
        </Text>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !fornecedorId}>
          {pending ? "Salvando..." : "Criar pedido"}
        </Button>
      </div>
    </form>
  );
}
