"use client";

import { useState, useTransition } from "react";
import { Plus, Power, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Text } from "@/components/ui/text";

import { alternarAtivoMembro, atualizarPapelUsuario } from "../actions";
import type { MembroEmpresa } from "../queries";
import { ConvidarUsuarioDialog } from "./convidar-usuario-dialog";

const PAPEL_LABEL: Record<string, string> = {
  owner: "Dono",
  financeiro: "Financeiro",
  operacional: "Operacional",
  leitura: "Somente leitura",
  comprador: "Comprador",
  aprovador: "Aprovador",
  recebedor: "Recebedor",
  solicitante: "Solicitante",
};

export interface MembrosTableProps {
  membros: MembroEmpresa[];
  souDono: boolean;
}

export function MembrosTable({ membros, souDono }: MembrosTableProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function mudarPapel(membro: MembroEmpresa, papel: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarPapelUsuario(membro.id, papel);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível atualizar o papel.");
      }
    });
  }

  function alternarAtivo(membro: MembroEmpresa) {
    setErro(null);
    startTransition(async () => {
      try {
        await alternarAtivoMembro(membro.id, !membro.ativo);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Não foi possível atualizar o membro.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {souDono && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setDialogAberto(true)}>
            <Plus className="h-4 w-4" />
            Convidar usuário
          </Button>
        </div>
      )}

      {erro && (
        <Text size="sm" tone="danger">
          {erro}
        </Text>
      )}

      {membros.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum membro convidado"
          description="Só você tem acesso a esta empresa por enquanto."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              {souDono && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {membros.map((membro) => (
              <TableRow key={membro.id}>
                <TableCell className="text-foreground font-medium">{membro.profiles?.nome_completo ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{membro.profiles?.email ?? "—"}</TableCell>
                <TableCell>
                  {souDono ? (
                    <Select
                      className="w-44"
                      value={membro.papel}
                      disabled={pending}
                      onChange={(event) => mudarPapel(membro, event.target.value)}
                    >
                      <option value="financeiro">Financeiro</option>
                      <option value="operacional">Operacional</option>
                      <option value="leitura">Somente leitura</option>
                      <option value="comprador">Comprador</option>
                      <option value="aprovador">Aprovador</option>
                      <option value="recebedor">Recebedor</option>
                      <option value="solicitante">Solicitante</option>
                    </Select>
                  ) : (
                    (PAPEL_LABEL[membro.papel] ?? membro.papel)
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={membro.ativo ? "success" : "outline"}>{membro.ativo ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                {souDono && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => alternarAtivo(membro)}>
                      <Power className="h-4 w-4" />
                      <span className="sr-only">{membro.ativo ? "Desativar" : "Reativar"}</span>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {souDono && <ConvidarUsuarioDialog open={dialogAberto} onOpenChange={setDialogAberto} />}
    </div>
  );
}
