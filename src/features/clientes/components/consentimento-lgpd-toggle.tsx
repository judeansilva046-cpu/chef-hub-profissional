"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarDataHora } from "@/lib/format";

import { atualizarConsentimentoLgpd } from "../actions";

export function ConsentimentoLgpdToggle({
  clienteId,
  consentimento,
  consentimentoEm,
}: {
  clienteId: string;
  consentimento: boolean;
  consentimentoEm: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Badge variant={consentimento ? "success" : "outline"}>
        {consentimento ? "Consentimento LGPD concedido" : "Sem consentimento LGPD"}
      </Badge>
      {consentimento && consentimentoEm && (
        <span className="text-muted-foreground text-xs">desde {formatarDataHora(consentimentoEm)}</span>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => atualizarConsentimentoLgpd(clienteId, !consentimento))}
      >
        {consentimento ? "Revogar" : "Registrar consentimento"}
      </Button>
    </div>
  );
}
