"use client";

import { useState, useTransition } from "react";
import { Plus, Power, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { formatarDataHora } from "@/lib/format";

import { alternarAtivoAgenteImpressao, excluirAgenteImpressao } from "../actions";
import type { AgenteImpressaoListagem } from "../queries";
import { AgenteImpressaoDialog } from "./agente-impressao-dialog";

export interface AgentesImpressaoManagerProps {
  agentes: AgenteImpressaoListagem[];
}

export function AgentesImpressaoManager({ agentes }: AgentesImpressaoManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const [agenteParaExcluir, setAgenteParaExcluir] = useState<AgenteImpressaoListagem | null>(
    null,
  );

  function alternarAtivo(agente: AgenteImpressaoListagem) {
    startTransition(async () => {
      try {
        await alternarAtivoAgenteImpressao(agente.id, !agente.ativo);
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Não foi possível atualizar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text weight="semibold">Agentes locais de impressão</Text>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDialogAberto(true);
            setDialogKey((key) => key + 1);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo agente
        </Button>
      </div>

      {agentes.length === 0 ? (
        <EmptyState
          title="Nenhum agente cadastrado"
          description="Crie um agente para conectar um computador Windows à fila de impressão."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Último contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentes.map((agente) => (
              <TableRow key={agente.id}>
                <TableCell className="text-foreground font-medium">{agente.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {agente.ultimo_ping_em ? formatarDataHora(agente.ultimo_ping_em) : "Nunca"}
                </TableCell>
                <TableCell>
                  <Badge variant={agente.ativo ? "success" : "outline"}>
                    {agente.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => alternarAtivo(agente)}
                    >
                      <Power className="h-4 w-4" />
                      <span className="sr-only">
                        {agente.ativo ? "Desativar" : "Ativar"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => setAgenteParaExcluir(agente)}
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

      <AgenteImpressaoDialog key={dialogKey} open={dialogAberto} onOpenChange={setDialogAberto} />

      <ConfirmDialog
        open={agenteParaExcluir !== null}
        onOpenChange={(open) => {
          if (!open) setAgenteParaExcluir(null);
        }}
        title="Excluir agente"
        description={
          agenteParaExcluir
            ? `Excluir o agente "${agenteParaExcluir.nome}"? A chave dele deixa de funcionar.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!agenteParaExcluir) return;
          await excluirAgenteImpressao(agenteParaExcluir.id);
          setAgenteParaExcluir(null);
        }}
      />
    </div>
  );
}
