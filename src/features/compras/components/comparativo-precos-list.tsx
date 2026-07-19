"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { formatarDataHora, formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { removerPrecoFornecedor } from "../actions";
import type { ComparativoPrecoIngrediente, PrecoFornecedorItem } from "../queries";
import { PrecoFornecedorDialog } from "./preco-fornecedor-dialog";

export interface ComparativoPrecosListProps {
  ingredientes: ComparativoPrecoIngrediente[];
  fornecedores: Tables<"fornecedores">[];
  unidadesMedida: Tables<"unidades_medida">[];
}

interface DialogState {
  ingredienteId: string;
  ingredienteNome: string;
  registro?: PrecoFornecedorItem;
}

export function ComparativoPrecosList({
  ingredientes,
  fornecedores,
  unidadesMedida,
}: ComparativoPrecosListProps) {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrir(state: DialogState) {
    setDialogState(state);
    setDialogKey((key) => key + 1);
  }

  function remover(id: string) {
    startTransition(async () => {
      try {
        await removerPrecoFornecedor(id);
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Não foi possível remover.",
        );
      }
    });
  }

  if (ingredientes.length === 0) {
    return (
      <EmptyState
        title="Nenhum ingrediente ativo"
        description="Cadastre ingredientes para comparar preços de fornecedores."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ingredientes.map((ingrediente) => (
        <Card key={ingrediente.ingredienteId}>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {ingrediente.ingredienteNome}
              </CardTitle>
              {ingrediente.precoMedio !== null && (
                <Text tone="muted" size="sm">
                  Preço médio: {formatarMoeda(ingrediente.precoMedio)}
                </Text>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                abrir({
                  ingredienteId: ingrediente.ingredienteId,
                  ingredienteNome: ingrediente.ingredienteNome,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Adicionar preço
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ingrediente.precos.length === 0 ? (
              <Text tone="muted" size="sm" className="px-6 pb-6">
                Nenhum preço cadastrado ainda.
              </Text>
            ) : (
              <Table className="border-0">
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Marca / embalagem</TableHead>
                    <TableHead>Preço ({ingrediente.unidadeSigla})</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Atualizado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingrediente.precos.map((preco, index) => {
                    const variacao =
                      preco.precoAnterior && preco.precoAnterior > 0
                        ? ((preco.precoUnitario - preco.precoAnterior) /
                            preco.precoAnterior) *
                          100
                        : null;

                    return (
                      <TableRow key={preco.id}>
                        <TableCell className="text-foreground font-medium">
                          <div className="flex flex-wrap items-center gap-2">
                            {preco.fornecedorNome}
                            {index === 0 && (
                              <Badge variant="success">Melhor preço</Badge>
                            )}
                            {preco.preferencial && (
                              <Badge variant="outline">Preferencial</Badge>
                            )}
                          </div>
                          {preco.codigoFornecedor && (
                            <Text tone="muted" size="sm">
                              Cód: {preco.codigoFornecedor}
                            </Text>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {preco.marca || preco.embalagem ? (
                            <>
                              {preco.marca && <span>{preco.marca}</span>}
                              {preco.marca && preco.embalagem && " · "}
                              {preco.embalagem && <span>{preco.embalagem}</span>}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {formatarMoeda(preco.precoUnitario)}
                            {variacao !== null && Math.abs(variacao) >= 0.5 && (
                              <span
                                className={`flex items-center text-xs ${
                                  variacao > 0 ? "text-destructive" : "text-success"
                                }`}
                              >
                                {variacao > 0 ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )}
                                {Math.abs(variacao).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {preco.prazoEntregaDias ? `${preco.prazoEntregaDias}d` : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatarDataHora(preco.atualizadoEm)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                abrir({
                                  ingredienteId: ingrediente.ingredienteId,
                                  ingredienteNome: ingrediente.ingredienteNome,
                                  registro: preco,
                                })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pending}
                              onClick={() => remover(preco.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {dialogState && (
        <PrecoFornecedorDialog
          key={dialogKey}
          open={Boolean(dialogState)}
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
          ingredienteId={dialogState.ingredienteId}
          ingredienteNome={dialogState.ingredienteNome}
          fornecedores={fornecedores}
          unidadesMedida={unidadesMedida}
          registro={dialogState.registro}
        />
      )}
    </div>
  );
}
