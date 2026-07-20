"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import type { ProvedorIntegracao } from "@/integrations/types";

import { conectarIntegracao } from "../actions";

export interface CredenciaisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provedor: ProvedorIntegracao;
  provedorLabel: string;
}

export function CredenciaisDialog({
  open,
  onOpenChange,
  provedor,
  provedorLabel,
}: CredenciaisDialogProps) {
  const [state, formAction, pending] = useActionState(conectarIntegracao, undefined);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar {provedorLabel}</DialogTitle>
          <DialogDescription>
            As credenciais ficam criptografadas no banco. Isso só grava a
            configuração — a conexão real com {provedorLabel} depende de
            credenciais de parceiro homologado, que ainda não existe neste
            projeto.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="provedor" value={provedor} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clientId">Client ID</Label>
            <Input id="clientId" name="clientId" required />
            {state?.fieldErrors?.clientId && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.clientId[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input id="clientSecret" name="clientSecret" type="password" required />
            {state?.fieldErrors?.clientSecret && (
              <Text size="sm" tone="danger">
                {state.fieldErrors.clientSecret[0]}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="identificadorExterno">
              Identificador do estabelecimento na {provedorLabel} (opcional)
            </Label>
            <Input id="identificadorExterno" name="identificadorExterno" placeholder="Ex: merchant ID / store ID" />
            <Text size="sm" tone="muted">
              Usado para reconhecer os pedidos recebidos por webhook como
              sendo desta empresa, quando a integração real existir.
            </Text>
          </div>

          {state?.formError && (
            <Text size="sm" tone="danger">
              {state.formError}
            </Text>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar credenciais"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
