"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";

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
import type { Tables } from "@/lib/supabase/database.types";

import { excluirUnidadeMedida } from "../actions";
import { TIPO_GRANDEZA_LABEL, type TipoGrandeza } from "../types";
import { UnidadeMedidaDialog } from "./unidade-medida-dialog";

export interface UnidadesMedidaManagerProps {
  unidades: Tables<"unidades_medida">[];
}

export function UnidadesMedidaManager({
  unidades,
}: UnidadesMedidaManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [unidadeEmEdicao, setUnidadeEmEdicao] = useState<
    Tables<"unidades_medida"> | undefined
  >(undefined);
  // Incrementado a cada abertura para remontar o UnidadeMedidaDialog (via
  // `key`) — evita que erro de validação ou campo de uma tentativa anterior
  // vaze para a próxima abertura do diálogo.
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrirCriacao() {
    setUnidadeEmEdicao(undefined);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function abrirEdicao(unidade: Tables<"unidades_medida">) {
    setUnidadeEmEdicao(unidade);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function excluir(unidade: Tables<"unidades_medida">) {
    if (!window.confirm(`Excluir a unidade "${unidade.nome}"?`)) return;

    startTransition(async () => {
      try {
        await excluirUnidadeMedida(unidade.id);
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
          Nova unidade
        </Button>
      </div>

      {unidades.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Nenhuma unidade cadastrada"
          description="As unidades padrão do sistema aparecem automaticamente aqui assim que forem seedadas."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Sigla</TableHead>
              <TableHead>Grandeza</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.map((unidade) => {
              const isSistema = unidade.empresa_id === null;
              return (
                <TableRow key={unidade.id}>
                  <TableCell className="text-foreground font-medium">
                    {unidade.nome}
                  </TableCell>
                  <TableCell>{unidade.sigla}</TableCell>
                  <TableCell>
                    {TIPO_GRANDEZA_LABEL[unidade.tipo_grandeza as TipoGrandeza]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isSistema ? "outline" : "default"}>
                      {isSistema ? "Padrão do sistema" : "Personalizada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isSistema && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => abrirEdicao(unidade)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => excluir(unidade)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <UnidadeMedidaDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        unidade={unidadeEmEdicao}
      />
    </div>
  );
}
