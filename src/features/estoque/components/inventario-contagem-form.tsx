"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { formatarDecimal } from "@/lib/format";

import { concluirInventario, salvarContagemInventario } from "../actions";
import type { ItemContagemFormState } from "../types";

export interface InventarioContagemFormProps {
  inventarioId: string;
  itensIniciais: ItemContagemFormState[];
  readOnly?: boolean;
}

export function InventarioContagemForm({
  inventarioId,
  itensIniciais,
  readOnly = false,
}: InventarioContagemFormProps) {
  const router = useRouter();
  const [itens, setItens] = useState(itensIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startSalvar] = useTransition();
  const [concluindo, startConcluir] = useTransition();

  function atualizarQuantidade(itemId: string, valor: number | null) {
    setItens((atual) =>
      atual.map((item) =>
        item.itemId === itemId ? { ...item, quantidadeContada: valor } : item,
      ),
    );
  }

  function salvar() {
    setErro(null);
    startSalvar(async () => {
      try {
        await salvarContagemInventario(
          inventarioId,
          itens.map((item) => ({
            itemId: item.itemId,
            quantidadeContada: item.quantidadeContada,
          })),
        );
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a contagem.",
        );
      }
    });
  }

  function concluir() {
    setErro(null);
    startConcluir(async () => {
      try {
        await salvarContagemInventario(
          inventarioId,
          itens.map((item) => ({
            itemId: item.itemId,
            quantidadeContada: item.quantidadeContada,
          })),
        );
        await concluirInventario(inventarioId);
        router.refresh();
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o inventário.",
        );
      }
    });
  }

  const pendente = salvando || concluindo;

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingrediente</TableHead>
            <TableHead>Saldo do sistema</TableHead>
            <TableHead>Quantidade contada</TableHead>
            <TableHead>Diferença</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => {
            const diferenca =
              item.quantidadeContada === null
                ? null
                : item.quantidadeContada - item.quantidadeSistema;

            return (
              <TableRow key={item.itemId}>
                <TableCell className="text-foreground font-medium">
                  {item.ingredienteNome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatarDecimal(item.quantidadeSistema)} {item.unidadeSigla}
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span className="text-foreground">
                      {item.quantidadeContada === null
                        ? "—"
                        : `${formatarDecimal(item.quantidadeContada)} ${item.unidadeSigla}`}
                    </span>
                  ) : (
                    <NumberField
                      value={item.quantidadeContada}
                      onChange={(valor) =>
                        atualizarQuantidade(item.itemId, valor)
                      }
                      min={0}
                      placeholder="0"
                      className="w-32"
                      disabled={pendente}
                    />
                  )}
                </TableCell>
                <TableCell
                  className={
                    !diferenca
                      ? "text-muted-foreground"
                      : diferenca > 0
                        ? "text-success"
                        : "text-danger"
                  }
                >
                  {diferenca === null
                    ? "—"
                    : `${diferenca > 0 ? "+" : ""}${formatarDecimal(diferenca)} ${item.unidadeSigla}`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={salvar} disabled={pendente}>
            {salvando ? "Salvando..." : "Salvar contagem"}
          </Button>
          <Button onClick={concluir} disabled={pendente}>
            {concluindo ? "Concluindo..." : "Concluir inventário"}
          </Button>
        </div>
      )}
    </div>
  );
}
