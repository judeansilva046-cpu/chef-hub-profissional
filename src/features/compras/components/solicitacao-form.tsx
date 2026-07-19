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

import { criarSolicitacaoCompra } from "../actions";
import { PRIORIDADE_LABEL } from "./status-badges";
import {
  criarItemSolicitacaoVazio,
  type SolicitacaoItemFormState,
} from "../types";
import { SolicitacaoItemRow } from "./solicitacao-item-row";

export interface SolicitacaoFormProps {
  ingredientes: IngredienteParaSelecao[];
  centrosCusto: Tables<"centros_custo">[];
}

export function SolicitacaoForm({ ingredientes, centrosCusto }: SolicitacaoFormProps) {
  const router = useRouter();
  const [observacao, setObservacao] = useState("");
  const [setor, setSetor] = useState("");
  const [centroCustoId, setCentroCustoId] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [justificativa, setJustificativa] = useState("");
  const [dataNecessaria, setDataNecessaria] = useState("");
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
          setor,
          centroCustoId: centroCustoId || null,
          prioridade,
          justificativa,
          dataNecessaria,
          itens: itens.map((item) => ({
            ingredienteId: item.ingredienteId,
            quantidade: item.quantidade,
            precoEstimado: item.precoEstimado,
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
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="setor">Setor (opcional)</Label>
              <Input
                id="setor"
                value={setor}
                onChange={(event) => setSetor(event.target.value)}
                placeholder="Ex: Cozinha, Salão, Bar"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="centroCustoId">Centro de custo (opcional)</Label>
              <Select
                id="centroCustoId"
                value={centroCustoId}
                onChange={(event) => setCentroCustoId(event.target.value)}
              >
                <option value="">Nenhum</option>
                {centrosCusto.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {centro.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                id="prioridade"
                value={prioridade}
                onChange={(event) => setPrioridade(event.target.value)}
              >
                {Object.entries(PRIORIDADE_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataNecessaria">Necessária até (opcional)</Label>
              <Input
                id="dataNecessaria"
                type="date"
                value={dataNecessaria}
                onChange={(event) => setDataNecessaria(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="justificativa">Justificativa (opcional)</Label>
            <Textarea
              id="justificativa"
              rows={2}
              value={justificativa}
              onChange={(event) => setJustificativa(event.target.value)}
              placeholder="Por que esta compra é necessária?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground grid grid-cols-12 gap-3 pb-2 text-xs font-medium tracking-wide uppercase">
            <span className="col-span-6">Ingrediente</span>
            <span className="col-span-2">Quantidade</span>
            <span className="col-span-3">Preço estimado</span>
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
