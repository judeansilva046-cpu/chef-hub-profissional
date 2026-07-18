"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";

import { convidarUsuario } from "../actions";

export interface ConvidarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvidarUsuarioDialog({ open, onOpenChange }: ConvidarUsuarioDialogProps) {
  const [state, formAction, pending] = useActionState(convidarUsuario, undefined);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <Text size="sm" tone="muted">
            A pessoa precisa já ter uma conta no Chef Hub Profissional.
          </Text>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="pessoa@exemplo.com" required />
            {state?.fieldErrors?.email && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.email[0]}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="papel">Papel</Label>
            <Select id="papel" name="papel" defaultValue="leitura" required>
              <option value="financeiro">Financeiro (lança e edita)</option>
              <option value="operacional">Operacional (uso do dia a dia)</option>
              <option value="leitura">Somente leitura</option>
            </Select>
            {state?.fieldErrors?.papel && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.papel[0]}
              </Text>
            )}
          </div>
          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Convidando..." : "Convidar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
