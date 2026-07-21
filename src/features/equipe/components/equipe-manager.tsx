"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import type { PapelEmpresa } from "@/server/auth/get-empresa-atual";

import {
  adicionarMembro,
  alterarPapel,
  alternarAtivo,
  removerMembro,
  type EquipeActionState,
} from "../actions";
import type { MembroEmpresaComPerfil } from "../queries";
import {
  PAPEL_EMPRESA_LABEL,
  PAPEIS_EMPRESA,
} from "../validation";

export interface EquipeManagerProps {
  membros: MembroEmpresaComPerfil[];
  podeGerir: boolean;
  ownerUsuarioId: string;
}

export function EquipeManager({
  membros,
  podeGerir,
  ownerUsuarioId,
}: EquipeManagerProps) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [removendo, setRemovendo] = useState<MembroEmpresaComPerfil | null>(
    null,
  );
  const [, startTransition] = useTransition();

  function abrirConvite() {
    setDialogAberto(true);
    setDialogKey((key) => key + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text tone="muted">
          {membros.length}{" "}
          {membros.length === 1 ? "membro" : "membros"} na empresa
        </Text>
        {podeGerir ? (
          <Button size="sm" onClick={abrirConvite}>
            <Plus className="h-4 w-4" />
            Convidar membro
          </Button>
        ) : null}
      </div>

      {membros.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum membro na equipe"
          description="Convide operadores pelo e-mail da conta Chef Hub."
          action={
            podeGerir ? (
              <Button size="sm" onClick={abrirConvite}>
                <Plus className="h-4 w-4" />
                Convidar membro
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              {podeGerir ? (
                <TableHead className="text-right">Ações</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {membros.map((membro) => {
              const ehOwnerPrimario = membro.usuario_id === ownerUsuarioId;
              return (
                <TableRow key={membro.id}>
                  <TableCell className="text-foreground font-medium">
                    {membro.profiles?.nome_completo ?? "—"}
                    {ehOwnerPrimario ? (
                      <Text as="span" tone="muted" className="ml-2 text-xs">
                        (owner primário)
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {membro.profiles?.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {podeGerir && !ehOwnerPrimario ? (
                      <Select
                        aria-label={`Papel de ${membro.profiles?.nome_completo ?? "membro"}`}
                        value={membro.papel}
                        onChange={(event) => {
                          const papel = event.target.value as PapelEmpresa;
                          startTransition(async () => {
                            await alterarPapel(membro.id, papel);
                          });
                        }}
                      >
                        {PAPEIS_EMPRESA.map((papel) => (
                          <option key={papel} value={papel}>
                            {PAPEL_EMPRESA_LABEL[papel]}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Text as="span">
                        {PAPEL_EMPRESA_LABEL[
                          membro.papel as (typeof PAPEIS_EMPRESA)[number]
                        ] ?? membro.papel}
                      </Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={membro.ativo ? "success" : "outline"}>
                      {membro.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  {podeGerir ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!ehOwnerPrimario ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                startTransition(async () => {
                                  await alternarAtivo(membro.id, !membro.ativo);
                                });
                              }}
                            >
                              {membro.ativo ? "Desativar" : "Reativar"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemovendo(membro)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </>
                        ) : (
                          <Text tone="muted" className="text-xs">
                            —
                          </Text>
                        )}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <ConvidarMembroDialog
        key={dialogKey}
        open={dialogAberto}
        onOpenChange={setDialogAberto}
      />

      <ConfirmDialog
        open={removendo !== null}
        onOpenChange={(open) => {
          if (!open) setRemovendo(null);
        }}
        title="Remover membro"
        description={
          removendo
            ? `Remover ${removendo.profiles?.nome_completo ?? "este membro"} da equipe?`
            : undefined
        }
        confirmLabel="Remover"
        destructive
        onConfirm={async () => {
          if (!removendo) return;
          await removerMembro(removendo.id);
          setRemovendo(null);
        }}
      />
    </div>
  );
}

interface ConvidarMembroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ConvidarMembroDialog({
  open,
  onOpenChange,
}: ConvidarMembroDialogProps) {
  const [state, formAction, pending] = useActionState<
    EquipeActionState | undefined,
    FormData
  >(adicionarMembro, undefined);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
    }
  }, [state?.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            O convidado precisa já ter conta no Chef Hub com o e-mail
            informado.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="operador@exemplo.com"
            />
            {state?.fieldErrors?.email ? (
              <Text tone="danger" className="text-sm">
                {state.fieldErrors.email[0]}
              </Text>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="papel">Papel</Label>
            <Select id="papel" name="papel" defaultValue="garcom" required>
              {PAPEIS_EMPRESA.map((papel) => (
                <option key={papel} value={papel}>
                  {PAPEL_EMPRESA_LABEL[papel]}
                </option>
              ))}
            </Select>
            {state?.fieldErrors?.papel ? (
              <Text tone="danger" className="text-sm">
                {state.fieldErrors.papel[0]}
              </Text>
            ) : null}
          </div>

          {state?.formError ? (
            <Text tone="danger" className="text-sm">
              {state.formError}
            </Text>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Convidando…" : "Convidar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
