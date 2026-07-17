"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";

import { criarSolicitacaoCompra } from "../actions";
import {
  criarItemSolicitacaoVazio,
  type SolicitacaoItemFormState,
} from "../types";
import { SolicitacaoItemRow } from "./solicitacao-item-row";

export interface SolicitacaoFormProps {
  ingredientes: IngredienteParaSelecao[];
}

export function SolicitacaoForm({ ingredientes }: SolicitacaoFormProps) {
  const router = useRouter();
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<SolicitacaoItemFormState[]>([
    criarItemSolicitacaoVazio(),
  ]);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function atualizarItem(uid: string, novoItem: SolicitacaoItemFormState) {
    setItens((atual) =>
      atual.map((item) => (item.uid === uid ? novoItem : item)),
    );
  }

  function removerItem(uid: string) {
    setItens((atual) => atual.filter((item) => item.uid !== uid));
  }

  function adicionarItem() {
    setItens((atual) => [...atual, criarItemSolicitacaoVazio()]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    startTransition(async () => {
      try {
        const id = await criarSolicitacaoCompra({
          observacao,
          itens: itens.map((item) => ({
            ingredienteId: item.ingredienteId,
            quantidade: item.quantidade,
          })),
        });
        router.push(`/compras/solicitacoes/${id}`);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível criar a solicitação.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Itens solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground grid grid-cols-12 gap-3 pb-2 text-xs font-medium tracking-wide uppercase">
            <span className="col-span-8">Ingrediente</span>
            <span className="col-span-3">Quantidade</span>
            <span className="col-span-1" />
          </div>

          {itens.map((item) => (
            <SolicitacaoItemRow
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <Textarea
          id="observacao"
          rows={3}
          value={observacao}
          onChange={(event) => setObservacao(event.target.value)}
          placeholder="Ex: Urgente para produção de sexta-feira"
        />
      </div>

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
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Criar solicitação"}
        </Button>
      </div>
    </form>
  );
}
