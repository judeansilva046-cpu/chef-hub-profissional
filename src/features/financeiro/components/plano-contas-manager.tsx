"use client";

import { useState, useTransition } from "react";
import { BookOpenText, Plus, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/database.types";

import { alternarAtivoPlanoConta } from "../actions";
import { PlanoContaDialog } from "./plano-conta-dialog";

const TIPO_LABEL: Record<string, string> = {
  receita: "Receita",
  despesa: "Despesa",
  ativo: "Ativo",
  passivo: "Passivo",
};

const TIPO_VARIANT: Record<string, "success" | "danger" | "info" | "outline"> = {
  receita: "success",
  despesa: "danger",
  ativo: "info",
  passivo: "outline",
};

export interface PlanoContasManagerProps {
  contas: Tables<"plano_contas">[];
}

export function PlanoContasManager({ contas }: PlanoContasManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pending, startTransition] = useTransition();

  function alternarAtivo(conta: Tables<"plano_contas">) {
    startTransition(async () => {
      try {
        await alternarAtivoPlanoConta(conta.id, !conta.ativo);
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
          Nova conta
        </Button>
      </div>

      {contas.length === 0 ? (
        <EmptyState icon={BookOpenText} title="Nenhuma conta cadastrada" description="Crie a primeira conta do plano." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="text-muted-foreground font-mono text-sm">{conta.codigo}</TableCell>
                <TableCell className={conta.conta_pai_id ? "text-foreground pl-6" : "text-foreground font-medium"}>
                  {conta.nome}
                </TableCell>
                <TableCell>
                  <Badge variant={TIPO_VARIANT[conta.tipo] ?? "outline"}>{TIPO_LABEL[conta.tipo] ?? conta.tipo}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={conta.ativo ? "success" : "outline"}>{conta.ativo ? "Ativa" : "Inativa"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternarAtivo(conta)}>
                    <Power className="h-4 w-4" />
                    <span className="sr-only">{conta.ativo ? "Inativar" : "Reativar"}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <PlanoContaDialog open={dialogAberto} onOpenChange={setDialogAberto} contas={contas} />
    </div>
  );
}
