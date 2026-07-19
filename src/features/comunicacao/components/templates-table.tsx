"use client";

import { useTransition } from "react";

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

import { alternarAtivoTemplate } from "../actions";

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  sms: "SMS",
  interno: "Interno",
};

export function TemplatesTable({ templates }: { templates: Tables<"crm_templates_mensagem">[] }) {
  const [pending, startTransition] = useTransition();

  if (templates.length === 0) {
    return <EmptyState title="Nenhum template cadastrado" description="Crie templates para reaproveitar em campanhas e interações." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Canal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="text-foreground font-medium">{template.nome}</TableCell>
            <TableCell className="text-muted-foreground">{CANAL_LABEL[template.canal] ?? template.canal}</TableCell>
            <TableCell>
              <Badge variant={template.ativo ? "success" : "outline"}>{template.ativo ? "Ativo" : "Inativo"}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => alternarAtivoTemplate(template.id, !template.ativo))}
              >
                {template.ativo ? "Desativar" : "Ativar"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
