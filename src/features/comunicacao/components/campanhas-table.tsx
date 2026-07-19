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
import { formatarDataHora } from "@/lib/format";

import { alternarAtivoCampanha, dispararCampanha } from "../actions";
import type { CampanhaComRelacoes } from "../queries";

const GATILHO_LABEL: Record<string, string> = {
  aniversario: "Aniversário",
  inatividade: "Inatividade",
  primeira_compra: "Primeira compra",
  manual: "Manual",
};

export function CampanhasTable({ campanhas }: { campanhas: CampanhaComRelacoes[] }) {
  const [pending, startTransition] = useTransition();

  if (campanhas.length === 0) {
    return <EmptyState title="Nenhuma campanha cadastrada" description="Crie campanhas automáticas para aniversário, inatividade ou primeira compra." />;
  }

  function disparar(id: string) {
    startTransition(async () => {
      try {
        const total = await dispararCampanha(id);
        window.alert(total > 0 ? `${total} cliente(s) contatado(s).` : "Nenhum cliente elegível no momento.");
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível disparar a campanha.");
      }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Gatilho</TableHead>
          <TableHead>Template</TableHead>
          <TableHead>Cupom</TableHead>
          <TableHead>Último disparo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campanhas.map((campanha) => (
          <TableRow key={campanha.id}>
            <TableCell className="text-foreground font-medium">{campanha.nome}</TableCell>
            <TableCell className="text-muted-foreground">
              {GATILHO_LABEL[campanha.gatilho] ?? campanha.gatilho}
              {campanha.gatilho === "inatividade" && campanha.dias_inatividade
                ? ` (${campanha.dias_inatividade}d)`
                : ""}
            </TableCell>
            <TableCell className="text-muted-foreground">{campanha.crm_templates_mensagem?.nome ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{campanha.crm_cupons?.codigo ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">
              {campanha.ultimo_disparo_em ? formatarDataHora(campanha.ultimo_disparo_em) : "Nunca"}
            </TableCell>
            <TableCell>
              <Badge variant={campanha.ativo ? "success" : "outline"}>{campanha.ativo ? "Ativa" : "Inativa"}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button size="sm" disabled={pending} onClick={() => disparar(campanha.id)}>
                  Disparar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => startTransition(() => alternarAtivoCampanha(campanha.id, !campanha.ativo))}
                >
                  {campanha.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
