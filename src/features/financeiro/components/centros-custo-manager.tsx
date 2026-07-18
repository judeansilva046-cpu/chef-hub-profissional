"use client";

import { useState, useTransition } from "react";
import { Plus, Power, Tags } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoCentroCusto } from "../actions";
import { CentroCustoDialog } from "./centro-custo-dialog";

export interface CentrosCustoManagerProps {
  centros: Tables<"centros_custo">[];
}

export function CentrosCustoManager({ centros }: CentrosCustoManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  function alternarAtivo(centro: Tables<"centros_custo">) {
    startTransition(async () => {
      try {
        await alternarAtivoCentroCusto(centro.id, !centro.ativo);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível atualizar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo centro de custo
        </Button>
      </div>

      {centros.length === 0 ? (
        <EmptyState icon={Tags} title="Nenhum centro de custo cadastrado" description="Crie o primeiro centro de custo." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centros.map((centro) => (
              <TableRow key={centro.id}>
                <TableCell className="text-muted-foreground font-mono text-sm">{centro.codigo}</TableCell>
                <TableCell className="text-foreground font-medium">{centro.nome}</TableCell>
                <TableCell>
                  <Badge variant={centro.ativo ? "success" : "outline"}>{centro.ativo ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternarAtivo(centro)}>
                    <Power className="h-4 w-4" />
                    <span className="sr-only">{centro.ativo ? "Inativar" : "Reativar"}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CentroCustoDialog open={dialogAberto} onOpenChange={setDialogAberto} />
    </div>
  );
}
