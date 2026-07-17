"use client";

import { useState, useTransition } from "react";
import { Pencil, Percent, Plus, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoCustoVariavel } from "../actions";
import { CustoVariavelDialog } from "./custo-variavel-dialog";

export interface CustosVariaveisManagerProps {
  custosVariaveis: Tables<"custos_variaveis">[];
}

export function CustosVariaveisManager({
  custosVariaveis,
}: CustosVariaveisManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [custoEmEdicao, setCustoEmEdicao] = useState<
    Tables<"custos_variaveis"> | undefined
  >(undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirCriacao() {
    setCustoEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(custo: Tables<"custos_variaveis">) {
    setCustoEmEdicao(custo);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(custo: Tables<"custos_variaveis">) {
    startTransition(async () => {
      try {
        await alternarAtivoCustoVariavel(custo.id, !custo.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar.",
        );
      }
    });
  }

  const ativos = custosVariaveis.filter((custo) => custo.ativo);
  const percentualTotal = ativos
    .filter((custo) => custo.tipo === "percentual_sobre_venda")
    .reduce((total, custo) => total + custo.valor, 0);
  const fixoTotal = ativos
    .filter((custo) => custo.tipo === "valor_fixo_por_venda")
    .reduce((total, custo) => total + custo.valor, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text tone="muted">
          Total ativo:{" "}
          <Text as="span" weight="semibold" tone="default">
            {formatarPercentual(percentualTotal)}
          </Text>{" "}
          +{" "}
          <Text as="span" weight="semibold" tone="default">
            {formatarMoeda(fixoTotal)}
          </Text>{" "}
          por venda
        </Text>
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Novo custo variável
        </Button>
      </div>

      {custosVariaveis.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhum custo variável cadastrado"
          description="Cadastre taxa de cartão, comissões e embalagens."
          action={
            <Button size="sm" onClick={abrirCriacao}>
              <Plus className="h-4 w-4" />
              Novo custo variável
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {custosVariaveis.map((custo) => (
              <TableRow key={custo.id}>
                <TableCell className="text-foreground font-medium">
                  {custo.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {custo.tipo === "percentual_sobre_venda"
                    ? "% sobre a venda"
                    : "Fixo por venda"}
                </TableCell>
                <TableCell>
                  {custo.tipo === "percentual_sobre_venda"
                    ? formatarPercentual(custo.valor)
                    : formatarMoeda(custo.valor)}
                </TableCell>
                <TableCell>
                  <Badge variant={custo.ativo ? "success" : "outline"}>
                    {custo.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => abrirEdicao(custo)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => alternarAtivo(custo)}
                    >
                      <Power className="h-4 w-4" />
                      <span className="sr-only">
                        {custo.ativo ? "Inativar" : "Reativar"}
                      </span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CustoVariavelDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        custoVariavel={custoEmEdicao}
      />
    </div>
  );
}
