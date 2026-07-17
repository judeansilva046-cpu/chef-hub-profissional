"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Power, Store, Trash2 } from "lucide-react";

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
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoCanalVenda, excluirCanalVenda } from "../actions";
import { TIPO_CANAL_OPCOES } from "../validation";
import { CanalVendaDialog } from "./canal-venda-dialog";

export interface CanaisVendaManagerProps {
  canais: Tables<"canais_venda">[];
}

const TIPO_LABEL = Object.fromEntries(
  TIPO_CANAL_OPCOES.map((opcao) => [opcao.value, opcao.label]),
);

export function CanaisVendaManager({ canais }: CanaisVendaManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [canalEmEdicao, setCanalEmEdicao] = useState<
    Tables<"canais_venda"> | undefined
  >(undefined);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirCriacao() {
    setCanalEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(canal: Tables<"canais_venda">) {
    setCanalEmEdicao(canal);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(canal: Tables<"canais_venda">) {
    startTransition(async () => {
      try {
        await alternarAtivoCanalVenda(canal.id, !canal.ativo);
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Não foi possível atualizar.",
        );
      }
    });
  }

  function excluir(canal: Tables<"canais_venda">) {
    if (!window.confirm(`Excluir o canal "${canal.nome}"?`)) return;

    startTransition(async () => {
      try {
        await excluirCanalVenda(canal.id);
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Não foi possível excluir.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={abrirCriacao}>
          <Plus className="h-4 w-4" />
          Novo canal
        </Button>
      </div>

      {canais.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Nenhum canal de venda cadastrado"
          description="Cadastre iFood, 99Food, Keeta, Delivery Próprio ou um canal personalizado."
          action={
            <Button size="sm" onClick={abrirCriacao}>
              <Plus className="h-4 w-4" />
              Novo canal
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Taxa fixa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {canais.map((canal) => (
              <TableRow key={canal.id}>
                <TableCell className="text-foreground font-medium">
                  {canal.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {TIPO_LABEL[canal.tipo] ?? canal.tipo}
                </TableCell>
                <TableCell>{formatarPercentual(canal.taxa_percentual)}</TableCell>
                <TableCell>{formatarMoeda(canal.taxa_fixa)}</TableCell>
                <TableCell>
                  <Badge variant={canal.ativo ? "success" : "outline"}>
                    {canal.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => abrirEdicao(canal)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => alternarAtivo(canal)}
                    >
                      <Power className="h-4 w-4" />
                      <span className="sr-only">
                        {canal.ativo ? "Inativar" : "Reativar"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => excluir(canal)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CanalVendaDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        canal={canalEmEdicao}
      />
    </div>
  );
}
