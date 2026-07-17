"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput, NumberField } from "@/components/ui/number-field";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { converterListaEmPedidos, salvarItensLista } from "../actions";
import type { ListaCompleta } from "../queries";

interface ItemFormState {
  itemId: string;
  ingredienteNome: string;
  unidadeSigla: string;
  fornecedorId: string | null;
  quantidadeSugerida: number;
  precoUnitarioPrevisto: number;
}

export interface ListaItensEditorProps {
  lista: ListaCompleta;
  fornecedores: Tables<"fornecedores">[];
}

export function ListaItensEditor({ lista, fornecedores }: ListaItensEditorProps) {
  const router = useRouter();
  const [itens, setItens] = useState<ItemFormState[]>(() =>
    lista.listas_compra_itens
      .slice()
      .sort((a, b) => a.ingredientes.nome.localeCompare(b.ingredientes.nome))
      .map((item) => ({
        itemId: item.id,
        ingredienteNome: item.ingredientes.nome,
        unidadeSigla: item.ingredientes.unidades_medida.sigla,
        fornecedorId: item.fornecedor_id,
        quantidadeSugerida: item.quantidade_sugerida,
        precoUnitarioPrevisto: item.preco_unitario_previsto,
      })),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startSalvar] = useTransition();
  const [convertendo, startConverter] = useTransition();

  const editavel = lista.status !== "convertida";

  const fornecedoresPorId = useMemo(
    () => new Map(fornecedores.map((fornecedor) => [fornecedor.id, fornecedor.nome])),
    [fornecedores],
  );

  const resumoPorFornecedor = useMemo(() => {
    const grupos = new Map<
      string,
      { nome: string; itens: number; valorTotal: number }
    >();

    for (const item of itens) {
      const chave = item.fornecedorId ?? "sem-fornecedor";
      const nome = item.fornecedorId
        ? (fornecedoresPorId.get(item.fornecedorId) ?? "Fornecedor")
        : "Sem fornecedor definido";
      const grupo = grupos.get(chave) ?? { nome, itens: 0, valorTotal: 0 };
      grupo.itens += 1;
      grupo.valorTotal += item.quantidadeSugerida * item.precoUnitarioPrevisto;
      grupos.set(chave, grupo);
    }

    return Array.from(grupos.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );
  }, [itens, fornecedoresPorId]);

  const valorTotalGeral = itens.reduce(
    (total, item) => total + item.quantidadeSugerida * item.precoUnitarioPrevisto,
    0,
  );
  const algumSemFornecedor = itens.some((item) => !item.fornecedorId);

  function atualizarItem(itemId: string, patch: Partial<ItemFormState>) {
    setItens((atual) =>
      atual.map((item) => (item.itemId === itemId ? { ...item, ...patch } : item)),
    );
  }

  function paraInput() {
    return itens.map((item) => ({
      itemId: item.itemId,
      fornecedorId: item.fornecedorId,
      quantidadeSugerida: item.quantidadeSugerida,
      precoUnitarioPrevisto: item.precoUnitarioPrevisto,
    }));
  }

  function salvar() {
    setErro(null);
    startSalvar(async () => {
      try {
        await salvarItensLista(lista.id, paraInput());
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Não foi possível salvar.",
        );
      }
    });
  }

  function converter() {
    setErro(null);
    startConverter(async () => {
      try {
        await salvarItensLista(lista.id, paraInput());
        await converterListaEmPedidos(lista.id);
        router.push("/compras/pedidos");
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível converter em pedidos.",
        );
      }
    });
  }

  const pendente = salvando || convertendo;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resumoPorFornecedor.map((grupo) => (
          <Card key={grupo.nome}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {grupo.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-lg font-semibold">
                {formatarMoeda(grupo.valorTotal)}
              </Text>
              <Text size="sm" tone="muted">
                {grupo.itens} item(ns)
              </Text>
            </CardContent>
          </Card>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingrediente</TableHead>
            <TableHead>Quantidade sugerida</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Preço unitário previsto</TableHead>
            <TableHead className="text-right">Valor previsto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.itemId}>
              <TableCell className="text-foreground font-medium">
                {item.ingredienteNome}
              </TableCell>
              <TableCell>
                {editavel ? (
                  <NumberField
                    value={item.quantidadeSugerida}
                    onChange={(value) =>
                      atualizarItem(item.itemId, {
                        quantidadeSugerida: value ?? 0,
                      })
                    }
                    min={0}
                    className="w-28"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {item.quantidadeSugerida} {item.unidadeSigla}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editavel ? (
                  <Select
                    aria-label="Fornecedor"
                    value={item.fornecedorId ?? ""}
                    onChange={(event) =>
                      atualizarItem(item.itemId, {
                        fornecedorId: event.target.value || null,
                      })
                    }
                    className="w-48"
                  >
                    <option value="">Sem fornecedor</option>
                    {fornecedores.map((fornecedor) => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="text-muted-foreground">
                    {item.fornecedorId
                      ? fornecedoresPorId.get(item.fornecedorId)
                      : "—"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editavel ? (
                  <CurrencyInput
                    value={item.precoUnitarioPrevisto}
                    onChange={(value) =>
                      atualizarItem(item.itemId, {
                        precoUnitarioPrevisto: value ?? 0,
                      })
                    }
                    min={0}
                    className="w-32"
                  />
                ) : (
                  <span className="text-muted-foreground">
                    {formatarMoeda(item.precoUnitarioPrevisto)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatarMoeda(item.quantidadeSugerida * item.precoUnitarioPrevisto)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <Text weight="semibold">Total geral: {formatarMoeda(valorTotalGeral)}</Text>
        {erro && (
          <Text size="sm" tone="danger">
            {erro}
          </Text>
        )}
      </div>

      {editavel && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={salvar} disabled={pendente}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button
            onClick={converter}
            disabled={pendente || algumSemFornecedor}
            title={
              algumSemFornecedor
                ? "Defina um fornecedor para todos os itens antes de converter."
                : undefined
            }
          >
            {convertendo ? "Convertendo..." : "Converter em pedidos"}
          </Button>
        </div>
      )}
    </div>
  );
}
