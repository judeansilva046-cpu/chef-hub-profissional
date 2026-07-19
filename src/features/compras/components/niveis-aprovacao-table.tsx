"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";

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
import { formatarMoeda } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoNivelAprovacao, removerNivelAprovacao } from "../actions";
import type { AprovadorDisponivel, NivelAprovacaoComCentroCusto } from "../queries";
import { NivelAprovacaoDialog } from "./nivel-aprovacao-dialog";

export interface NiveisAprovacaoTableProps {
  niveis: NivelAprovacaoComCentroCusto[];
  centrosCusto: Tables<"centros_custo">[];
  aprovadores: AprovadorDisponivel[];
}

export function NiveisAprovacaoTable({
  niveis,
  centrosCusto,
  aprovadores,
}: NiveisAprovacaoTableProps) {
  const [nivelEmEdicao, setNivelEmEdicao] = useState<
    NivelAprovacaoComCentroCusto | undefined
  >(undefined);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function abrir(nivel?: NivelAprovacaoComCentroCusto) {
    setNivelEmEdicao(nivel);
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  function alternarAtivo(nivel: NivelAprovacaoComCentroCusto) {
    startTransition(async () => {
      try {
        await alternarAtivoNivelAprovacao(nivel.id, !nivel.ativo);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível atualizar.");
      }
    });
  }

  function remover(nivel: NivelAprovacaoComCentroCusto) {
    startTransition(async () => {
      try {
        await removerNivelAprovacao(nivel.id);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível remover.");
      }
    });
  }

  function descreverAprovador(nivel: NivelAprovacaoComCentroCusto) {
    if (nivel.usuario_aprovador_id) {
      return aprovadores.find((a) => a.usuarioId === nivel.usuario_aprovador_id)?.nome ?? "Usuário específico";
    }
    if (nivel.papel_aprovador === "owner") return "Dono da empresa";
    return "Papel: aprovador";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => abrir(undefined)}>
          <Plus className="h-4 w-4" />
          Nova faixa
        </Button>
      </div>

      {niveis.length === 0 ? (
        <EmptyState
          title="Nenhuma faixa de aprovação configurada"
          description="Sem faixas, qualquer usuário com papel de aprovador (ou o dono) pode aprovar qualquer solicitação."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Faixa de valor</TableHead>
              <TableHead>Centro de custo</TableHead>
              <TableHead>Aprovador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {niveis.map((nivel) => (
              <TableRow key={nivel.id}>
                <TableCell className="text-foreground font-medium">{nivel.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatarMoeda(nivel.valor_minimo)} —{" "}
                  {nivel.valor_maximo ? formatarMoeda(nivel.valor_maximo) : "sem limite"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {nivel.centros_custo?.nome ?? "Qualquer"}
                </TableCell>
                <TableCell className="text-muted-foreground">{descreverAprovador(nivel)}</TableCell>
                <TableCell>
                  <Badge variant={nivel.ativo ? "success" : "outline"}>
                    {nivel.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => abrir(nivel)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternarAtivo(nivel)}>
                      <Power className="h-4 w-4" />
                      <span className="sr-only">{nivel.ativo ? "Desativar" : "Reativar"}</span>
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => remover(nivel)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <NivelAprovacaoDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        nivel={nivelEmEdicao}
        centrosCusto={centrosCusto}
        aprovadores={aprovadores}
      />
    </div>
  );
}
