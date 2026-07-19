"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/database.types";
import { formatarDataHora } from "@/lib/format";

import { atualizarStatusTarefa } from "../actions";

const PRIORIDADE_VARIANT: Record<string, "outline" | "info" | "warning" | "danger"> = {
  baixa: "outline",
  media: "info",
  alta: "warning",
  urgente: "danger",
};

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export function TarefasTable({ tarefas }: { tarefas: Tables<"crm_tarefas">[] }) {
  const [pending, startTransition] = useTransition();

  if (tarefas.length === 0) {
    return <EmptyState title="Nenhuma tarefa" description="Crie tarefas de follow-up para clientes e leads." />;
  }

  const hoje = new Date();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tarefas.map((tarefa) => {
          const atrasada = tarefa.prazo && tarefa.status === "pendente" && new Date(tarefa.prazo) < hoje;
          return (
            <TableRow key={tarefa.id}>
              <TableCell className="text-foreground font-medium">{tarefa.titulo}</TableCell>
              <TableCell>
                <Badge variant={PRIORIDADE_VARIANT[tarefa.prioridade] ?? "outline"}>
                  {PRIORIDADE_LABEL[tarefa.prioridade] ?? tarefa.prioridade}
                </Badge>
              </TableCell>
              <TableCell className={atrasada ? "text-danger" : "text-muted-foreground"}>
                {tarefa.prazo ? formatarDataHora(tarefa.prazo) : "—"}
              </TableCell>
              <TableCell>
                <Select
                  value={tarefa.status}
                  disabled={pending}
                  className="w-40"
                  onChange={(e) => startTransition(() => atualizarStatusTarefa(tarefa.id, e.target.value))}
                >
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </Select>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
