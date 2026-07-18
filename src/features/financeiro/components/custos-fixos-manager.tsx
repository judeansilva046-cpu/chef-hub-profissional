"use client";

import { useState, useTransition } from "react";
import { Landmark, Pencil, Plus, Power } from "lucide-react";

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
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoCustoFixo } from "../actions";
import { CATEGORIA_CUSTO_FIXO_OPCOES } from "../validation";
import { CustoFixoDialog } from "./custo-fixo-dialog";

export interface CustosFixosManagerProps {
  custosFixos: Tables<"custos_fixos">[];
}

const CATEGORIA_LABEL = Object.fromEntries(
  CATEGORIA_CUSTO_FIXO_OPCOES.map((opcao) => [opcao.value, opcao.label]),
);

export function CustosFixosManager({ custosFixos }: CustosFixosManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [custoEmEdicao, setCustoEmEdicao] = useState<
    Tables<"custos_fixos"> | undefined
  >(undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirCriacao() {
    setCustoEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(custo: Tables<"custos_fixos">) {
    setCustoEmEdicao(custo);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(custo: Tables<"custos_fixos">) {
    startTransition(async () => {
      try {
        await alternarAtivoCustoFixo(custo.id, !custo.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar.",
        );
      }
    });
  }

  const totalAtivo = custosFixos
    .filter((custo) => custo.ativo)
    .reduce((total, custo) => total + custo.valor_mensal, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text tone="muted">
          Total mensal ativo:{" "}
          <Text as="span" weight="semibold" tone="default">
            {formatarMoeda(totalAtivo)}
          </Text>
        </Text>
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Novo custo fixo
        </Button>
      </div>

      {custosFixos.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhum custo fixo cadastrado"
          description="Cadastre aluguel, salários e outras despesas recorrentes mensais."
          action={
            <Button size="sm" onClick={abrirCriacao}>
              <Plus className="h-4 w-4" />
              Novo custo fixo
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor mensal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {custosFixos.map((custo) => (
              <TableRow key={custo.id}>
                <TableCell className="text-foreground font-medium">
                  {custo.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {CATEGORIA_LABEL[custo.categoria] ?? custo.categoria}
                </TableCell>
                <TableCell>{formatarMoeda(custo.valor_mensal)}</TableCell>
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

      <CustoFixoDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        custoFixo={custoEmEdicao}
      />
    </div>
  );
}
