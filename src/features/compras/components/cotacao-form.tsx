"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import type { IngredienteParaSelecao } from "@/features/ingredientes/queries";
import type { Tables } from "@/lib/supabase/database.types";

import { criarCotacao } from "../actions";
import type { SolicitacaoParaCotacao } from "../queries";
import {
  criarItemCotacaoVazio,
  type CotacaoItemFormState,
} from "../types";
import { CotacaoItemRow } from "./cotacao-item-row";

export interface CotacaoFormProps {
  ingredientes: IngredienteParaSelecao[];
  fornecedores: Tables<"fornecedores">[];
  solicitacoes: SolicitacaoParaCotacao[];
}

export function CotacaoForm({ ingredientes, fornecedores, solicitacoes }: CotacaoFormProps) {
  const router = useRouter();
  const [solicitacaoOrigemId, setSolicitacaoOrigemId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [itens, setItens] = useState<CotacaoItemFormState[]>([criarItemCotacaoVazio()]);
  const [fornecedorIds, setFornecedorIds] = useState<string[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function atualizarItem(uid: string, novoItem: CotacaoItemFormState) {
    setItens((atual) => atual.map((item) => (item.uid === uid ? novoItem : item)));
  }

  function removerItem(uid: string) {
    setItens((atual) => atual.filter((item) => item.uid !== uid));
  }

  function adicionarItem() {
    setItens((atual) => [...atual, criarItemCotacaoVazio()]);
  }

  function carregarItensDaSolicitacao(id: string) {
    setSolicitacaoOrigemId(id);
    const solicitacao = solicitacoes.find((s) => s.id === id);
    if (!solicitacao) return;
    setItens(
      solicitacao.solicitacoes_compra_itens.map((item) => ({
        uid: crypto.randomUUID(),
        ingredienteId: item.ingrediente_id,
        quantidade: item.quantidade,
      })),
    );
  }

  function alternarFornecedor(id: string) {
    setFornecedorIds((atual) =>
      atual.includes(id) ? atual.filter((f) => f !== id) : [...atual, id],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    startTransition(async () => {
      try {
        const id = await criarCotacao({
          solicitacaoOrigemId: solicitacaoOrigemId || null,
          observacao,
          itens: itens.map((item) => ({
            ingredienteId: item.ingredienteId,
            quantidade: item.quantidade,
          })),
          fornecedorIds,
        });
        router.push(`/compras/cotacoes/${id}`);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível criar a cotação.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {solicitacoes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="solicitacaoOrigemId">Criar a partir de uma solicitação aprovada (opcional)</Label>
          <Select
            id="solicitacaoOrigemId"
            value={solicitacaoOrigemId}
            onChange={(event) => carregarItensDaSolicitacao(event.target.value)}
          >
            <option value="">Nenhuma — itens manuais</option>
            {solicitacoes.map((solicitacao) => (
              <option key={solicitacao.id} value={solicitacao.id}>
                #{solicitacao.numero} {solicitacao.setor ? `— ${solicitacao.setor}` : ""}
              </option>
            ))}
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Itens a cotar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground grid grid-cols-12 gap-3 pb-2 text-xs font-medium tracking-wide uppercase">
            <span className="col-span-8">Ingrediente</span>
            <span className="col-span-3">Quantidade</span>
            <span className="col-span-1" />
          </div>

          {itens.map((item) => (
            <CotacaoItemRow
              key={item.uid}
              item={item}
              ingredientes={ingredientes}
              onChange={(novoItem) => atualizarItem(item.uid, novoItem)}
              onRemove={() => removerItem(item.uid)}
              podeRemover={itens.length > 1}
            />
          ))}

          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={adicionarItem}>
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fornecedores convidados</CardTitle>
        </CardHeader>
        <CardContent>
          {fornecedores.length === 0 ? (
            <Text tone="muted" size="sm">
              Nenhum fornecedor ativo cadastrado.
            </Text>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {fornecedores.map((fornecedor) => (
                <label key={fornecedor.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fornecedorIds.includes(fornecedor.id)}
                    onChange={() => alternarFornecedor(fornecedor.id)}
                  />
                  {fornecedor.nome}
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="observacao">Observação (opcional)</Label>
        <Textarea
          id="observacao"
          rows={3}
          value={observacao}
          onChange={(event) => setObservacao(event.target.value)}
        />
      </div>

      {erro && (
        <Text tone="danger" size="sm">
          {erro}
        </Text>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Criar cotação"}
        </Button>
      </div>
    </form>
  );
}
